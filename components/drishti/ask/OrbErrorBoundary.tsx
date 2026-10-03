"use client";

import { Component, type ReactNode } from "react";

export class OrbErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[orb] disabled, showing fallback:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
