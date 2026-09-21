"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";

import { Button, Panel, iconProps } from "@/components/drishti";

type RunErrorBoundaryProps = {
  children: ReactNode;
  subject: string;
};

type RunErrorBoundaryState = {
  message: string | null;
  detail: string | null;
  attempt: number;
};

const BAD_ID_PATTERN = /ArgumentValidationError|does not match validator/i;

export class RunErrorBoundary extends Component<
  RunErrorBoundaryProps,
  RunErrorBoundaryState
> {
  state: RunErrorBoundaryState = { message: null, detail: null, attempt: 0 };

  static getDerivedStateFromError(error: unknown): Partial<RunErrorBoundaryState> {
    const raw =
      error instanceof Error && error.message.trim() !== ""
        ? error.message.trim()
        : "The server returned no message.";
    return {
      message: BAD_ID_PATTERN.test(raw)
        ? "The address is not a valid id, so no stored record can be opened."
        : "The server did not answer. It may be unreachable, or the request was rejected.",
      detail: raw,
    };
  }

  private retry = (): void => {
    this.setState((previous) => ({
      message: null,
      detail: null,
      attempt: previous.attempt + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.message !== null) {
      return (
        <Panel interactive={false} className="p-5" ariaLabel={`Could not load ${this.props.subject}`}>
          <p
            role="alert"
            className="flex items-start gap-2 text-[13px] leading-[1.5] text-[var(--danger,#f87171)]"
          >
            <CircleAlert
              {...iconProps}
              size={16}
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>
              Could not load {this.props.subject}. {this.state.message}
            </span>
          </p>
          {this.state.detail === null ? null : (
            <p className="mt-2 break-words font-mono text-[11.5px] leading-[1.5] text-[var(--text-tertiary,#64646f)]">
              {this.state.detail}
            </p>
          )}
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={this.retry}
              icon={<RefreshCw {...iconProps} size={14} />}
            >
              Retry
            </Button>
          </div>
        </Panel>
      );
    }
    return <div key={this.state.attempt}>{this.props.children}</div>;
  }
}
