import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useAppActions, chatIsListedInAllChatsSection } from '../contexts/AppContext';
import {
  ASTRA_FOCUS_CHAT_SEARCH,
  ASTRA_TRIGGER_ATTACH,
  ASTRA_REQUEST_DELETE_CURRENT_CHAT,
  ASTRA_OPEN_SETTINGS,
  ASTRA_OPEN_AGENT_CONSTRUCTOR,
  ASTRA_OPEN_TRANSCRIPTION_SIDEBAR,
  isPrimaryModifier,
  isTypingInField,
} from '../constants/hotkeys';

/**
 * Глобальные сочетания: Alt+S/A/T — настройки / конструктор / транскрибатор;
 * Shift+K, O, U, Ctrl+Del — чаты и вложения.
 * Слушатель в фазе capture, с preventDefault где нужно.
 */
export default function GlobalKeyboardShortcuts() {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { createChat, setCurrentChat, deleteChat } = useAppActions();
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Alt+S / Alt+A / Alt+T (без Ctrl/Meta/Shift) — по физ. клавише, чтобы работало и в русской раскладке
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (isTypingInField(e.target)) {
          // дальше не обрабатываем
        } else if (e.code === 'KeyS') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(ASTRA_OPEN_SETTINGS));
          return;
        } else if (e.code === 'KeyA') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(ASTRA_OPEN_AGENT_CONSTRUCTOR));
          return;
        } else if (e.code === 'KeyT') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(ASTRA_OPEN_TRANSCRIPTION_SIDEBAR));
          return;
        }
      }

      const mod = isPrimaryModifier(e);
      if (!mod) return;

      const keyLower = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      // Ctrl+U — вложения: срабатывает и из поля ввода чата
      if (keyLower === 'u') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(ASTRA_TRIGGER_ATTACH));
        return;
      }

      if (isTypingInField(e.target)) return;

      if (keyLower === 'k' && e.shiftKey) {
        e.preventDefault();
        const s = stateRef.current;
        const cur = s.chats.find((c) => c.id === s.currentChatId) ?? null;
        if (cur && !chatIsListedInAllChatsSection(cur)) {
          deleteChat(cur.id);
        }
        const id = createChat();
        setCurrentChat(id);
        navigate('/');
        return;
      }

      if (keyLower === 'o') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(ASTRA_FOCUS_CHAT_SEARCH));
        return;
      }

      const isForwardDelete = e.key === 'Delete' || e.code === 'Delete';
      if (isForwardDelete) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(ASTRA_REQUEST_DELETE_CURRENT_CHAT));
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [navigate, createChat, setCurrentChat, deleteChat]);

  return null;
}
