import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import Head from 'next/head';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const loadMore = useCallback(() => {
    fetch(nextPage)
      .then(response => {
        return response.json();
      })
      .then(data => {
        const { next_page } = data;

        const results: Post[] = data.results.map((post: Post) => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setPosts([...posts, ...results]);
        setNextPage(next_page);
      });
  }, [nextPage, posts]);

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`}>
              <a key={post.uid}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <p>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      "dd MMM' 'yyyy",
                      {
                        locale: ptBR,
                      }
                    )}
                  </p>
                  <p>
                    <FiUser /> {post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {nextPage && (
          <button type="button" className={styles.morePosts} onClick={loadMore}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const { next_page } = response;

  const results = response.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: {
        next_page,
        results,
      },
    },
  };
};
