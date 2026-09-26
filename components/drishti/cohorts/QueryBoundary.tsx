"use client";


import { Component, type ReactNode } from "react";
import { CircleAlert, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../Button";
import { iconProps } from "../tokens";

type QueryBoundaryProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

type QueryBoundaryState = {
  error: Error | null;
};

export class QueryBoundary extends Component<
  QueryBoundaryProps,
  QueryBoundaryState
> {
  state: QueryBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): QueryBoundaryState {
    return { error };
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return (
      <section
        role="alert"
        className={cn(
          "flex flex-col items-start gap-3 rounded-lg border border-[var(--danger)] bg-[var(--bg-raised)] p-4",
          this.props.className,
        )}
      >
        <span className="flex items-center gap-2 text-[13px] font-medium text-[var(--danger)]">
          <CircleAlert
            {...iconProps}
            size={16}
            aria-hidden="true"
            className="size-4 shrink-0"
          />
          {this.props.label} could not load.
        </span>
        <p className="max-w-[68ch] text-[13px] leading-[1.5] text-[var(--text-secondary)]">
          {error.message}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={this.retry}
          icon={<RefreshCw {...iconProps} size={14} />}
        >
          Retry
        </Button>
      </section>
    );
  }
}
