'use client';

import { useEffect } from 'react';

/**
 * ページ遷移時のフェードインアニメーションを処理するコンポーネント。
 * lang-switching-out クラスを除去し、lang-switching-in を付与して
 * フェードインアニメーションを実行する。
 */
export function PageTransitionIn() {
    useEffect(() => {
        // フェードアウトが残っていれば除去し、フェードインを開始
        document.documentElement.classList.remove('lang-switching-out');
        document.documentElement.classList.add('lang-switching-in');

        const tid = window.setTimeout(() => {
            document.documentElement.classList.remove('lang-switching-in');
        }, 500);

        return () => window.clearTimeout(tid);
    }, []);

    return null;
}
