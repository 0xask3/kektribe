import { useRef, useState } from 'react';

export type Message = {
  id: number;
  message: string;
  byUser: boolean;
};
export function useMessages({ maxLength = 5 }: { maxLength: number }) {
  const idRef = useRef<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (message: string, byUser: boolean = false) => {
    setMessages(messages => [
      ...messages.slice(-maxLength),
      { message, byUser, id: idRef.current++ },
    ]);
  };

  return { messages, setMessages, addMessage };
}
