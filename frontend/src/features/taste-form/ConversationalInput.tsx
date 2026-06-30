import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onSubmit: (text: string) => void;
  onPickManually: () => void;
}

/**
 * Primary taste entry (US4): a friendly free-text box. The visitor describes
 * what they're in the mood for; the backend interprets it into genres. A quiet
 * link lets people who'd rather pick tags jump straight to the structured form.
 */
export function ConversationalInput({ onSubmit, onPickManually }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed) onSubmit(trimmed);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="panel chat-panel">
      <h2 className="chat-heading">{t('chat.heading')}</h2>
      <p className="chat-hint">{t('chat.hint')}</p>

      <textarea
        className="chat-input"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t('chat.placeholder')}
        aria-label={t('chat.heading')}
      />

      <div className="chat-actions">
        <button type="button" className="btn btn-primary" onClick={submit} disabled={!text.trim()}>
          {t('chat.submit')}
        </button>
        <button type="button" className="link-btn" onClick={onPickManually}>
          {t('chat.pickManually')}
        </button>
      </div>
    </div>
  );
}
