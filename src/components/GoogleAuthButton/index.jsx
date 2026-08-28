import { useEffect, useRef, useState } from 'react';
import { Box } from '@mantine/core';
import { GoogleLogin } from '@react-oauth/google';

// GoogleLogin (react-oauth) só aceita width em pixels, não '100%'. Um valor
// fixo maior que a tela (ex. 380) não encolhe — e por causa do min-width:auto
// do flexbox, isso força o formSide inteiro a ficar mais largo que a
// viewport no mobile, vazando conteúdo pra fora da tela. Medimos o
// container real e usamos essa largura, até um teto de 380.
export const GoogleAuthButton = ({ onSuccess, onError, text }) => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(380);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const atualizarLargura = () => {
      const largura = el.getBoundingClientRect().width;
      if (largura > 0) setWidth(Math.min(380, Math.floor(largura)));
    };

    atualizarLargura();

    const observer = new ResizeObserver(atualizarLargura);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={containerRef} style={{ width: '100%', maxWidth: 380 }}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="outline"
        size="large"
        shape="pill"
        text={text}
        width={width}
      />
    </Box>
  );
};
