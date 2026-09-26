type MarkProps = { className?: string };

export function GoogleMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.97h3.86c2.26-2.08 3.56-5.14 3.56-8.79z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.97c-1.08.72-2.44 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.32c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.65H1.29A11.97 11.97 0 0 0 0 12c0 1.94.47 3.76 1.29 5.35l3.98-3.03z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.6 4.6 1.79l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.65l3.98 3.09c.95-2.85 3.6-4.99 6.73-4.99z"
      />
    </svg>
  );
}

export function YouTubeMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#FF0000"
        d="M23.5 6.19a3 3 0 0 0-2.11-2.12C19.51 3.55 12 3.55 12 3.55s-7.51 0-9.39.52A3 3 0 0 0 .5 6.19 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.81 3 3 0 0 0 2.11 2.12c1.88.52 9.39.52 9.39.52s7.51 0 9.39-.52a3 3 0 0 0 2.11-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.81z"
      />
      <path fill="#FFFFFF" d="M9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
    </svg>
  );
}

export function GoogleNewsMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="2" y="2" width="9.5" height="9.5" rx="2" fill="#4285F4" />
      <rect x="12.5" y="2" width="9.5" height="9.5" rx="2" fill="#EA4335" />
      <rect x="2" y="12.5" width="9.5" height="9.5" rx="2" fill="#FBBC05" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" rx="2" fill="#34A853" />
    </svg>
  );
}

export function GoogleAdsMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M12 1 3 6v6c0 5.1 3.8 9.7 9 11 1.7-.42 3.2-1.3 4.5-2.5L9 13V8.7l9-4.6z"
      />
      <path fill="#FBBC05" d="M21 6v6c0 3.9-2.2 7.5-5.4 9.3L9 13l7.5-4.4z" />
      <path fill="#34A853" d="M16.5 20.3A11 11 0 0 1 12 22c-.9 0-1.7-.09-2.5-.26l3.9-5.44z" />
    </svg>
  );
}

export function GoogleTrendsMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <path
          id="trends-leaf"
          d="M4,20 C1,14 4,7 11,4 C14,2.7 17,2.7 20,4 C22,6 21,11 17,14 C13,17 8,19.5 4,20 Z"
        />
        <clipPath id="trends-band-0"><rect x="1.25" y="3" width="9.5" height="30" transform="rotate(-45 6 18)" /></clipPath>
        <clipPath id="trends-band-1"><rect x="5.25" y="-1" width="9.5" height="30" transform="rotate(-45 10 14)" /></clipPath>
        <clipPath id="trends-band-2"><rect x="9.25" y="-5" width="9.5" height="30" transform="rotate(-45 14 10)" /></clipPath>
        <clipPath id="trends-band-3"><rect x="13.25" y="-9" width="9.5" height="30" transform="rotate(-45 18 6)" /></clipPath>
      </defs>
      <use href="#trends-leaf" fill="#4285F4" clipPath="url(#trends-band-0)" />
      <use href="#trends-leaf" fill="#EA4335" clipPath="url(#trends-band-1)" />
      <use href="#trends-leaf" fill="#FBBC05" clipPath="url(#trends-band-2)" />
      <use href="#trends-leaf" fill="#34A853" clipPath="url(#trends-band-3)" />
    </svg>
  );
}
