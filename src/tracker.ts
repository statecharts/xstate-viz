import { isHidden } from './utils';

type Listener = (data: TrackerData) => void;

export interface TrackerData {
  listeners: Set<Listener>;
  element: Element | undefined;
  rect: ClientRect | undefined;
  hidden: boolean;
}

class Tracker {
  public elements: Map<string, TrackerData> = new Map();
  constructor() {
    if (typeof window !== 'undefined') {
      let timeout: number;

      window.addEventListener('resize', () => {
        if (timeout) {
          cancelAnimationFrame(timeout);
        }
        timeout = requestAnimationFrame(() => {
          this.updateAll();
        });
      });
    }
  }

  updateAll(): void {
    Array.from(this.elements.keys()).forEach(key => {
      this.update(key, this.elements.get(key)!.element);
    });
  }

  update(id: string, element: Element | null | undefined) {
    if (!this.elements.get(id)) {
      this.elements.set(id, {
        listeners: new Set(),
        element: element || undefined,
        rect: element ? element.getBoundingClientRect() : undefined,
        hidden: isHidden(element)
      });
    }
    const data = {
      ...this.elements.get(id)!,
      element: element || undefined,
      rect: element ? element.getBoundingClientRect() : undefined,
      hidden: isHidden(element)
    };

    this.notify(data);

    if (element) {
      const desc = element.querySelectorAll(`[data-id]`);

      Array.from(desc).forEach(el => {
        const id = el.getAttribute(`data-id`)!;

        this.update(id, el);
      });
    }
  }

  listen(id: string, listener: Listener) {
    if (!this.elements.get(id)) {
      this.elements.set(id, {
        listeners: new Set(),
        element: undefined,
        rect: undefined,
        hidden: true
      });
    }

    const data = this.elements.get(id)!;
    data.listeners.add(listener);

    this.notify(data);
  }

  get(id: string): TrackerData | undefined {
    if (this.elements.get(id)) {
      return this.elements.get(id);
    }

    return undefined;
  }

  notify(data: TrackerData) {
    data.listeners.forEach(listener => {
      listener(data);
    });
  }
}

const tracker = new Tracker();

export { tracker };
