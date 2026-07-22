import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { CustomerCommunication } from '../../types';
import { listMyMessages, sendMessage } from '../../api/portalApi';

export function PortalMessages() {
  const [messages, setMessages] = useState<CustomerCommunication[]>([]);
  const [text, setText] = useState('');

  const load = () => listMyMessages().then(setMessages).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(text);
    setText('');
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>

      <div className="space-y-2">
        {messages.length === 0 && <p className="text-sm text-foreground/60">No communication history yet.</p>}
        {messages.map((m) => (
          <Card key={m.id} className={`p-4 max-w-md ${m.direction === 'outbound' ? 'ml-auto bg-primary/10' : ''}`}>
            <p className="text-xs text-foreground/50 mb-1 uppercase">{m.channel} · {m.direction}</p>
            <p className="text-sm">{m.message}</p>
            <p className="text-xs text-foreground/40 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <input className="flex-1 border border-border rounded px-3 py-2 text-sm" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}
