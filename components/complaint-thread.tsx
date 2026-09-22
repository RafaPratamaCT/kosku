import { cn } from '@/lib/utils';
import { formatDateTime, initials } from '@/lib/format';

export type ThreadMessage = {
  id: string;
  message: string;
  createdAt: Date;
  authorName: string;
  isAdmin: boolean;
};

export function ComplaintThread({
  description,
  createdAt,
  authorName,
  photoUrls,
  replies,
  viewerIsAdmin,
}: {
  description: string;
  createdAt: Date;
  authorName: string;
  photoUrls: string[];
  replies: ThreadMessage[];
  viewerIsAdmin: boolean;
}) {
  return (
    <div className="space-y-5">
      <Bubble
        authorName={authorName}
        createdAt={createdAt}
        message={description}
        mine={!viewerIsAdmin}
        isAdmin={false}
      >
        {photoUrls.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {photoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt="Foto komplain"
                  className="size-24 rounded-md border border-line object-cover transition hover:opacity-90"
                />
              </a>
            ))}
          </div>
        ) : null}
      </Bubble>

      {replies.map((reply) => (
        <Bubble
          key={reply.id}
          authorName={reply.authorName}
          createdAt={reply.createdAt}
          message={reply.message}
          mine={viewerIsAdmin ? reply.isAdmin : !reply.isAdmin}
          isAdmin={reply.isAdmin}
        />
      ))}
    </div>
  );
}

function Bubble({
  authorName,
  createdAt,
  message,
  mine,
  isAdmin,
  children,
}: {
  authorName: string;
  createdAt: Date;
  message: string;
  mine: boolean;
  isAdmin: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('flex gap-3', mine && 'flex-row-reverse')}>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md text-[11.5px] font-bold',
          isAdmin ? 'bg-brand text-white' : 'bg-surface-muted text-ink-muted',
        )}
        aria-hidden
      >
        {initials(authorName)}
      </span>

      <div className={cn('max-w-[76%] space-y-1.5', mine && 'items-end text-right')}>
        <div
          className={cn(
            'inline-block rounded-xl px-4 py-3 text-left text-[13.5px] leading-relaxed',
            mine ? 'bg-brand-soft text-ink' : 'bg-surface-muted text-ink',
          )}
        >
          <p className="whitespace-pre-line">{message}</p>
          {children}
        </div>
        <p className={cn('text-[11.5px] text-ink-subtle', mine && 'text-right')}>
          {authorName}
          {isAdmin ? ' · Pemilik kos' : ''} · {formatDateTime(createdAt)}
        </p>
      </div>
    </div>
  );
}
