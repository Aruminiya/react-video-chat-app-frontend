# React WebRTC Video Chat App

本專案是一個基於 **React**、**TypeScript** 與 **Vite** 的 WebRTC 視訊聊天應用程式前端。你可以用它快速建立點對點的視訊通話功能，適合學習或作為專案起點。

## 技術棧

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [WebRTC](https://webrtc.org/) (即時視訊/音訊串流)
- [ESLint](https://eslint.org/) (程式碼品質檢查)

## 功能特色

- 雙人視訊通話（WebRTC）
- 即時音訊與視訊串流
- 使用 React hooks 管理狀態
- 開發環境支援 HMR（Hot Module Replacement）

## 開發啟動

1. 安裝依賴：
   ```bash
   npm install
   ```
2. 啟動開發伺服器：
   ```bash
   npm run dev
   ```
3. 於瀏覽器開啟 [http://localhost:5200](http://localhost:5200)

## 程式碼品質

本專案已整合 ESLint，建議根據需求擴充 type-aware lint 規則，提升程式碼品質與一致性。

```js
// eslint.config.js 範例
export default tseslint.config({
  extends: [
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

## 其他

- 歡迎根據需求擴充功能或整合更多 React/TypeScript 插件。
- 如需協助，請開啟 issue。

---
Made with ❤️ using React, Vite, and WebRTC.