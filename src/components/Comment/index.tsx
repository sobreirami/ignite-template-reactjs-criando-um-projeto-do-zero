import { useEffect } from 'react';

export default function Comment(): JSX.Element {
  useEffect(() => {
    const utteranceTheme = 'github-dark';
    const scriptEl = document.createElement('script');
    const anchor = document.getElementById('comment-box');
    scriptEl.setAttribute('src', 'https://utteranc.es/client.js');
    scriptEl.setAttribute('crossorigin', 'anonymous');
    scriptEl.setAttribute('async', 'true');
    scriptEl.setAttribute(
      'repo',
      'sobreirami/ignite-template-reactjs-criando-um-projeto-do-zero'
    );
    scriptEl.setAttribute('issue-term', 'pathname');
    scriptEl.setAttribute('theme', utteranceTheme);
    anchor.appendChild(scriptEl);
  }, []);

  return <div id="comment-box" />;
}
