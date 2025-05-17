import { useRef, useState } from 'react';
import { io } from 'socket.io-client';

// 定義 React 組件 Home，負責視訊連線的邏輯和界面
function Home() {
  // 定義本地視訊元素的引用，用於顯示本地攝影機畫面
  const localVideoRef = useRef<HTMLVideoElement>(null);
  // 定義遠端視訊元素的引用，用於顯示對方用戶的畫面
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // 儲存 Socket.io 連線實例
  const [socket, setSocket] = useState<any>(null);
  // 儲存用戶輸入的房間 ID
  const [roomId, setRoomId] = useState('');
  // 控制是否在房間中（用於禁用輸入框和按鈕）
  const [inRoom, setInRoom] = useState(false);
  // 儲存 WebRTC 的 RTCPeerConnection 物件，負責點對點連線
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // 取得本地音視訊串流的函數
  const getLocalStream = async () => {
    // 請求用戶的攝影機和麥克風權限，取得音視訊串流
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    // 將串流設置到本地視訊元素，顯示本地畫面
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    // 返回串流，供 WebRTC 使用
    return stream;
  };

  // 建立房間的函數
  const createRoom = async () => {
    // 初始化 Socket.io 連線，連接到後端伺服器
    const socketIo = io('http://localhost:3000');
    // 儲存 Socket.io 實例
    setSocket(socketIo);
    // 標記為已進入房間，禁用輸入框和按鈕
    setInRoom(true);

    // 取得本地音視訊串流
    const localStream = await getLocalStream();

    // 創建 WebRTC 的 RTCPeerConnection 物件，配置 STUN 伺服器以支援 NAT 穿透
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    // 儲存 RTCPeerConnection 物件
    pcRef.current = pc;

    // 將本地串流的音訊和視訊軌道添加到 RTCPeerConnection
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    // 監聽 ICE candidate 事件，當生成新的候選者時觸發
    // ICE candidate 是在 setLocalDescription 設置本地 SDP（offer 或 answer）後開始收集
    // 每次生成一個 candidate，onicecandidate 事件會觸發，將 candidate 發送給對方
    pc.onicecandidate = (event) => {
      console.log('ICE candidate:', event.candidate);
      // 如果有新的 ICE candidate，通過 Socket.io 發送給房間中的其他用戶
      // 當 event.candidate 為 null 時，表示 ICE 收集完成
      if (event.candidate) {
        socketIo.emit('candidate', { roomId, candidate: event.candidate });
      }
    };

    // 監聽遠端串流事件，當收到對方的音視訊流時顯示到遠端視訊元素
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        // 將遠端串流設置到遠端視訊元素，顯示對方畫面
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // 通知後端建立房間
    socketIo.emit('create', { roomId });

    // 監聽來自對方的 offer 事件
    socketIo.on('offer', async (data: any) => {
      // 設置對方的 offer 為遠端描述，提供對方的 SDP 資訊
      // 此步驟不會觸發 ICE 收集，但為後續連線協商提供必要資訊
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      // 創建 answer（回應），包含本地的 SDP
      const answer = await pc.createAnswer();
      // 設置本地描述為 answer，觸發 ICE candidate 收集
      // 在此之後，onicecandidate 事件會陸續觸發，發送生成的 candidate
      await pc.setLocalDescription(answer);
      // 將 answer 發送給房間中的其他用戶
      socketIo.emit('answer', { roomId, answer });
    });

    // 監聽來自對方的 ICE candidate 事件
    socketIo.on('candidate', async (data: any) => {
      // 如果收到對方的 ICE candidate，添加到 RTCPeerConnection
      // 這需要遠端 SDP（setRemoteDescription）已設置，否則無法正確處理
      if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });
  };

  // 加入房間的函數
  const joinRoom = async () => {
    // 初始化 Socket.io 連線，連接到後端伺服器
    const socketIo = io('http://localhost:3000');
    // 儲存 Socket.io 實例
    setSocket(socketIo);
    // 標記為已進入房間，禁用輸入框和按鈕
    setInRoom(true);

    // 取得本地音視訊串流
    const localStream = await getLocalStream();
    // 創建 WebRTC 的 RTCPeerConnection 物件
    const pc = new RTCPeerConnection();
    // 儲存 RTCPeerConnection 物件
    pcRef.current = pc;

    // 將本地串流的音訊和視訊軌道添加到 RTCPeerConnection
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    // 監聽 ICE candidate 事件，當生成新的候選者時觸發
    // ICE candidate 是在 setLocalDescription 設置本地 SDP（offer）後開始收集
    // 每次生成一個 candidate，onicecandidate 事件會觸發，將 candidate 發送給對方
    pc.onicecandidate = (event) => {
      // 如果有新的 ICE candidate，通過 Socket.io 發送給房間中的其他用戶
      // 當 event.candidate 為 null 時，表示 ICE 收集完成
      if (event.candidate) {
        socketIo.emit('candidate', { roomId, candidate: event.candidate });
      }
    };

    // 監聽遠端串流事件，當收到對方的音視訊流時顯示到遠端視訊元素
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        // 將遠端串流設置到遠端視訊元素，顯示對方畫面
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // 通知後端加入房間
    socketIo.emit('join', { roomId });

    // 創建 WebRTC offer（提議），包含本地的 SDP
    const offer = await pc.createOffer();
    // 設置本地描述為 offer，觸發 ICE candidate 收集
    // 在此之後，onicecandidate 事件會陸續觸發，發送生成的 candidate
    await pc.setLocalDescription(offer);
    // 將 offer 發送給房間中的其他用戶
    socketIo.emit('offer', { roomId, offer });

    // 監聽來自對方的 answer 事件
    socketIo.on('answer', async (data: any) => {
      // 設置對方的 answer 為遠端描述，提供對方的 SDP 資訊
      // 此步驟不會觸發新的 ICE 收集，但完成 SDP 協商，確保連線正常進行
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    // 監聽來自對方的 ICE candidate 事件
    socketIo.on('candidate', async (data: any) => {
      // 如果收到對方的 ICE candidate，添加到 RTCPeerConnection
      // 這需要遠端 SDP（setRemoteDescription）已設置，否則無法正確處理
      if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });
  };

  // 渲染用戶界面
  return (
    <div>
      <div>
        {/* 輸入框：用於輸入房間 ID，進入房間後禁用 */}
        <input
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
          placeholder="Room ID"
          disabled={inRoom}
        />
        {/* 按鈕：建立房間，進入房間後禁用 */}
        <button onClick={createRoom} disabled={inRoom}>建立房間</button>
        {/* 按鈕：加入房間，進入房間後禁用 */}
        <button onClick={joinRoom} disabled={inRoom}>加入房間</button>
      </div>
      {/* 視訊顯示區域：左右並排顯示本地和遠端視訊 */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <div>
          <div>自己</div>
          {/* 本地視訊：顯示本地攝影機畫面，自動播放 */}
          <video ref={localVideoRef} autoPlay playsInline style={{ width: 300, background: '#222' }} />
        </div>
        <div>
          <div>對方</div>
          {/* 遠端視訊：顯示對方用戶的畫面，自動播放 */}
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 300, background: '#222' }} />
        </div>
      </div>
    </div>
  );
}

export default Home;