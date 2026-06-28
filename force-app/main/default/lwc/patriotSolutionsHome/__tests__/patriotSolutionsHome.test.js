import { createElement } from "@lwc/engine-dom";
import PatriotSolutionsHome from "c/patriotSolutionsHome";

const A11Y_STORAGE_KEY = "patriot_a11y_v1";

describe("c-patriot-solutions-home accessibility", () => {
  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    window.localStorage.clear();
  });

  async function flushPromises() {
    return Promise.resolve();
  }

  function createComponent() {
    const element = createElement("c-patriot-solutions-home", {
      is: PatriotSolutionsHome
    });
    document.body.appendChild(element);
    return element;
  }

  function navigateToSettings(element) {
    const settingsButton = [
      ...element.shadowRoot.querySelectorAll("button")
    ].find((button) => button.dataset.view === "settings");
    settingsButton.click();
  }

  it("loads default accessibility preferences on connect", async () => {
    const element = createComponent();
    await flushPromises();

    expect(element.shadowRoot.querySelector(".skip-link")).not.toBeNull();
    expect(element.getAttribute("data-theme")).toBe("light");
  });

  it("persists accessibility preferences to localStorage", async () => {
    const element = createComponent();
    navigateToSettings(element);
    await flushPromises();

    const checkbox = element.shadowRoot.querySelector(
      'lightning-input[data-pref="boldText"]'
    );
    expect(checkbox).not.toBeNull();

    checkbox.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: { checked: true }
      })
    );
    await flushPromises();

    const stored = JSON.parse(window.localStorage.getItem(A11Y_STORAGE_KEY));
    expect(stored.boldText).toBe(true);
  });

  it("applies host data attributes when preferences change", async () => {
    const element = createComponent();
    navigateToSettings(element);
    await flushPromises();

    const checkbox = element.shadowRoot.querySelector(
      'lightning-input[data-pref="reduceMotion"]'
    );
    checkbox.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: { checked: true }
      })
    );

    const themeSelect = element.shadowRoot.querySelector(
      'lightning-combobox[data-pref="theme"]'
    );
    themeSelect.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: { value: "dark" }
      })
    );

    const fontScale = element.shadowRoot.querySelector(
      'lightning-slider[data-pref="fontScale"]'
    );
    fontScale.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: { value: 125 }
      })
    );
    await flushPromises();

    expect(element.getAttribute("data-reduce-motion")).toBe("true");
    expect(element.getAttribute("data-theme")).toBe("dark");
    expect(element.style.getPropertyValue("--font-scale")).toBe("1.25");
  });

  it("resets accessibility preferences to defaults", async () => {
    const element = createComponent();
    navigateToSettings(element);
    await flushPromises();

    const checkbox = element.shadowRoot.querySelector(
      'lightning-input[data-pref="boldText"]'
    );
    checkbox.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: { checked: true }
      })
    );
    await flushPromises();

    const resetButton = [...element.shadowRoot.querySelectorAll("button")].find(
      (button) => button.textContent.includes("Reset accessibility to defaults")
    );
    expect(resetButton).not.toBeUndefined();

    resetButton.click();
    await flushPromises();

    expect(window.localStorage.getItem(A11Y_STORAGE_KEY)).toBeNull();
    expect(element.getAttribute("data-bold-text")).toBe("false");
  });

  it("opens keyboard shortcuts panel on question mark key", async () => {
    const element = createComponent();
    await flushPromises();

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "?", bubbles: true })
    );
    await flushPromises();

    expect(element.shadowRoot.querySelector(".shortcuts-panel")).not.toBeNull();
  });

  it("shows accessibility section at top of settings view", async () => {
    const element = createComponent();
    navigateToSettings(element);
    await flushPromises();

    const a11yTitle = element.shadowRoot.querySelector(
      ".a11y-settings .settings-section-title"
    );
    expect(a11yTitle).not.toBeNull();
    expect(a11yTitle.textContent).toBe("Accessibility");
  });

  it("shows accessibility preview badge on settings view", async () => {
    const element = createComponent();
    navigateToSettings(element);
    await flushPromises();

    const highContrast = element.shadowRoot.querySelector(
      'lightning-input[data-pref="highContrast"]'
    );
    highContrast.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: { checked: true }
      })
    );

    const reduceMotion = element.shadowRoot.querySelector(
      'lightning-input[data-pref="reduceMotion"]'
    );
    reduceMotion.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: { checked: true }
      })
    );
    await flushPromises();

    const badge = element.shadowRoot.querySelector(".settings-preview-badge");
    expect(badge.textContent).toContain("High Contrast");
    expect(badge.textContent).toContain("Reduced Motion");
  });

  it("loads default accessibility preferences even when localStorage has saved values", async () => {
    window.localStorage.setItem(
      A11Y_STORAGE_KEY,
      JSON.stringify({
        boldText: true,
        highContrast: true,
        theme: "dark"
      })
    );

    const element = createComponent();
    await flushPromises();

    expect(element.getAttribute("data-bold-text")).toBe("false");
    expect(element.getAttribute("data-high-contrast")).toBe("false");
    expect(element.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem(A11Y_STORAGE_KEY)).toBeNull();
  });

  it("scrolls main content to top when navigating to a new view", async () => {
    const rafSpy = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback();
        return 0;
      });

    const element = createComponent();
    await flushPromises();

    const main = element.shadowRoot.querySelector(".main-content");
    Object.defineProperty(main, "scrollTop", {
      writable: true,
      value: 240
    });

    const candidatesButton = [
      ...element.shadowRoot.querySelectorAll("button")
    ].find((button) => button.dataset.view === "candidates");
    candidatesButton.click();
    await flushPromises();

    expect(main.scrollTop).toBe(0);
    rafSpy.mockRestore();
  });
});
