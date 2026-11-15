// src/hooks/useTema.ts — modo claro u oscuro, el mismo que se elige en el login.
import { useState } from 'react';

export type Tema = 'claro' | 'oscuro';
const TEMA_KEY = 'sigesa_tema';

function temaGuardado(): Tema {
  try {
    return localStorage.getItem(TEMA_KEY) === 'oscuro' ? 'oscuro' : 'claro';
  } catch {
    return 'claro';
  }
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaGuardado);

  function cambiarTema(t: Tema) {
    setTema(t);
    try {
      localStorage.setItem(TEMA_KEY, t);
    } catch {
      /* sin almacenamiento: el tema solo dura esta visita */
    }
  }

  return { tema, cambiarTema };
}
