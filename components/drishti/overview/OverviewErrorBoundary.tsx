"use client";

import { CircleAlert } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button, iconProps } from "@/components/drishti";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class OverviewErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== "production") {
      console.error("Overview query failed", error, info);
    }
  }

  private retry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-[var(--danger)] bg-[var(--bg-raised)] p-4"
        >
          <p className="flex items-center gap-2 type-body text-[var(--danger)]">
            <CircleAlert
              {...iconProps}
              size={16}
              aria-hidden="true"
              className="size-4 shrink-0"
            />
            The overview could not load its data.
          </p>
          <p className="type-caption text-fg-secondary [overflow-wrap:anywhere]">
            {this.state.error.message}
          </p>
          <div>
            <Button variant="ghost" size="sm" onClick={this.retry}>
              Retry
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
