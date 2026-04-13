import "@testing-library/jest-dom";

// jsdom には ResizeObserver が存在しないため、cmdk 等の利用時にポリフィルが必要
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
