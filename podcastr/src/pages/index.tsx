import { useEffect } from "react";
import { Header } from "../components/Header";
import Link from "next/link";
import Image from "next/image";
import { GetStaticProps } from "next";
import { api } from "../services/api";
import { format, parseISO } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { convertDurationToTimeString } from "../utils/convertDurationToTimeString";
import Head from 'next/head';
import styles from "./home.module.scss";
import { usePlayer } from "../contexts/PlayerContext";

type Episode = {
  id: string,
  title: string,
  thumbnail: string,
  members: string,
  publishedAt: string,
  duration: number,
  durationAsString: string,
  description: string,
  url: string
}
interface HomeProps {
  latestEpisodes: Episode[],
  allEpisodes: Episode[]
}

export default function Home({ latestEpisodes, allEpisodes }: HomeProps) {

  // São carregados somente no momento em que a pessoa acessa (SPA)
  // useEffect(() => {
  //   fetch('http://localhost:3333/episodes')
  //   .then(response => response.json())  
  //   .then(data => console.log(data))
  // }, [])

  const { 
    playList,
    currentEpisodeIndex,
    isPlaying,
    setPlayingState
  } = usePlayer();

  const episodeList = [...latestEpisodes, ...allEpisodes];

  return (
    <div className={styles.homepage}>
      <Head>
        <title>Home | Podcastr</title>
      </Head>

      <section className={styles.latestEpisodes}>
        <h2>Últimos lançamentos</h2>
        <ul>
          {latestEpisodes.map((episode, index) => {
            return (
              <li key={episode.id}>
                <div style={{ width: 100 }}>
                  <Image 
                    width={192} 
                    height={192} 
                    src={episode.thumbnail} 
                    alt={episode.title} 
                    objectFit={"cover"}
                    className={styles.thumbnail}
                  />
                </div>
                <div className={styles.episodeDetails}>
                  <Link href={`/episodes/${episode.id}`}>
                    <a>{episode.title}</a>
                  </Link>
                  <p>{episode.members}</p>
                  <span>{episode.publishedAt}</span>
                  <span>{episode.durationAsString}</span>
                </div>
                {
                  (currentEpisodeIndex === index && isPlaying) ? (
                    <button 
                      type="button" 
                      onClick={() => setPlayingState(false)}
                      className={styles.isPlaying}
                    >
                      <img src="/pause.svg" alt="Pausar episódio" />
                    </button>
                  ) : (
                    <button type="button" onClick={() => playList(episodeList, index)}>
                      <img src="/play-green.svg" alt="Tocar episódio" />
                    </button>
                  )
                }
                
              </li>
            )
          })}
        </ul>
      </section>

      <section className={styles.allEpisodes}>
        <h2>Todos os episódios</h2>
        <table cellSpacing={0}>
          <thead>
            <tr>
              <th></th>
              <th>Podcast</th>
              <th>Integrantes</th>
              <th>Data</th>
              <th>Duração</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {allEpisodes.map((episode, index) => {
              return(
                <tr key={episode.id}>
                  <td style={{ width: 72 }}>
                    <Image 
                      width={120}
                      height={120}
                      src={episode.thumbnail}
                      alt={episode.title}
                      objectFit="cover"
                    />
                  </td>
                  <td>
                    <Link href={`/episodes/${episode.id}`}>
                      <a>{episode.title}</a>
                    </Link>
                  </td>
                  <td>{episode.members}</td>
                  <td style={{ width: 100 }}>{episode.publishedAt}</td>
                  <td>{episode.durationAsString}</td>
                  <td>
                    {
                      (currentEpisodeIndex === (index + latestEpisodes.length) && isPlaying) ? (
                        <button 
                          type="button" 
                          onClick={() => setPlayingState(false)}
                          className={styles.isPlaying}
                        >
                          <img src="/pause.svg" alt="Pausar episódio" />
                        </button>
                      ) : (
                        <button type="button" onClick={() => playList(episodeList, index + latestEpisodes.length)}>
                          <img src="/play-green.svg" alt="Tocar episódio" />
                        </button>
                      )
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}

// Ideal para coisas que ficam mudando constantemente (SSR)
// export async function getServerSideProps() {
//   const response = await fetch('http://localhost:3333/episodes/');
//   const data = await response.json();

//   return { 
//     props: {
//       episodes: data
//     }
//   }
// }

export  const getStaticProps: GetStaticProps = async () => {
    const { data } = await api.get('episodes/',{
      params: { 
        _limit:12, 
        _sort: "published_at",
        _order: "desc"
      }
    });

    const episodes = data.map((episode) => {
      return {
        id: episode.id,
        title: episode.title,
        thumbnail: episode.thumbnail,
        members: episode.members,
        publishedAt: format(parseISO(episode.published_at), 'd MMM yy',{ locale: ptBR }),
        duration: Number(episode.file.duration),
        durationAsString: convertDurationToTimeString(episode.file.duration),
        description: episode.description,
        url: episode.file.url
      }
    });

    const latestEpisodes = episodes.slice(0, 2);
    const allEpisodes = episodes.slice(2, episodes.length);
  
    return { 
      props: {
        latestEpisodes,
        allEpisodes
      },
      // definir o tempo em segundos pra nova chamada
      revalidate: 60 * 60 * 8
    }
  }
