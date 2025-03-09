import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import InstallationToast from "@/components/toast";
import { ChatMessage, MessageOutput, WindowAI, getWindowAI } from "window.ai";
import { useDispatch, useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/router";
import Image from "next/image";

import { toggleLikeGame, toggleFollowUser } from "../../reducers/globalSlice";

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<string>("start");
  const [playerOptions, setPlayerOptions] = useState<string[]>([]);
  const [game, setGame] = useState({});

  const dispatch = useDispatch();
  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const gameMusicRef = useRef<HTMLAudioElement | null>(null);
  const aiRef = useRef<WindowAI | null>(null);

  const activeMessages: ChatMessage[] = messages.filter(
    (message) => message.content !== "Start Game"
  );

  const games = useSelector((state) => state.global.games);
  const users = useSelector((state) => state.global.users);

  const creator = users[game?.creatorId];

  const activeUser = { id: 0 };

  useEffect(() => {
    const selectedGame = games.find(
      (gameItem) => gameItem.id === parseInt(game.id)
    );

    if (selectedGame) {
      setGame(selectedGame);
    }
  }, [games]);

  useEffect(() => {
    const gameId = router.query.gameId;

    const selectedGame = games.find(
      (gameItem) => gameItem.id === parseInt(gameId)
    );

    if (selectedGame) {
      setGame(selectedGame);

      setTimeout(() => {
        gameMusicRef.current?.play();
      }, 50);
    }
  }, [router.query.gameId]);

  const extractPlayerOptions = (inputMessage: string) => {
    const optionsStart = inputMessage.lastIndexOf("[|]");

    if (optionsStart === -1) {
      return;
    }

    const optionsSection = inputMessage.substring(
      optionsStart,
      inputMessage.length
    );

    var lines = optionsSection.split("\n");
    var choices = [];
    var re = /^\d\.\s*(.+)/;

    for (var i = 0; i < lines.length; i++) {
      var match = re.exec(lines[i]);
      if (match) {
        choices.push(match[1]);
        const newPlayerOptions = choices.slice(0, choices.length - 1);
        setPlayerOptions(newPlayerOptions);
      }
    }
  };

  const startGame = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    handleSendMessage(event);
    setActiveView("play");
    gameMusicRef.current?.play();
  };

  const gamePrompt = `
    You are a game called ${game.name}.

    ${game.name} is a game where ${game.idea}.

    You will create a background and a world for the game.

    Make the game extremely fun, exciting, and entertaining.

    The player has an HP counter that gets impacted by their actions in the game.

    The player has a money counter that gets impacted by their actions in the game.

    The player has various skill stats that are relevant to the game. You will choose the skill stats and make them relevant to the game.

    Every action the player does will have an impact on their skill stats. Certain actions will increase one or multiple skill stats. Other actions will decrease one or multiple skill stats. Other actions will increase some skill stats and decrease others. Whenever the player takes an action, you should determine how that action impacts their skill stats and then adjust the skill stats accordingly.

    The player can do literally anything. If they say they want to go somewhere or do something, allow them to, and make it relevant to the game.

    If the player wants to do an action that would require a skill in real life that is not listed above, add that as a new skill available in the game.

    If the player tries to take an action that they don't have high enough skills for, they fail at the action.

    Anything that the player wants to do that costs money in real life also costs money in the game.

    For every money-making action the player takes, you should determine which skill stats are most relevant to that action. If the player has a higher skill stat relevant to that action, it will become easier to make money doing that action. If the player has a lower skill stat relevant to that action, it will become harder to make money doing that action.

    If the player tries to make money by taking an action that they don't have high enough skills for, they fail at the action and don't make any money. They can even lose money if failing at that action would cause a person to lose money in real life.

    The player can also buy and collect items relevant to the actions they want to do. If the player wants to do an action that would require an item in real life, they first need to acquire that item in the game. For example, if the player wants to play guitar in the game, they first need to acquire a guitar in the game.

    Whenever the player needs to have a conversation with an NPC, do not summarize the conversation. Do not choose what the player will say for them. Ask the player what they want to say during every interaction with every NPC.

    You will allow things to happen faster in the game than they would typically happen in real life.

    Whenever you display the player's stats, display them on one line, like in this example -- **HP:** 100 | **Money:** $100 | **Strength:** 10 | **Speed:** 10

    You will NEVER display the player's stats as a numbered list.

    At the end of EVERY step of the game, you will ask the user what they would like to do. Then, you will show this symbol: [|]. Then, you will give the player suggestions for some things they can do. You will format these suggestions in a numbered list. This is the only situation where you will use a numbered list. You will not use a numbered list in any situation other than giving the player a list of suggestions at the end of every step of the game.

    Use markdown to format the text in the game. You can use markdown to make the text bold, italic, underlined, etc.
  `;

  useEffect(() => {
    const init = async () => {
      aiRef.current = await getWindowAI();
      if (!aiRef.current) {
        toast.custom(<InstallationToast />, {
          id: "window-ai-not-detected",
        });
      }
    };
    init();
  }, []);

  const scrollToBottom = () => {
    // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setTimeout(() => {
      scrollToBottom();
    }, 1000);
  }, [messages]);

  const handleSendMessage = async (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.FormEvent<HTMLButtonElement>,
    optionInput: string | null = null
  ) => {
    event.preventDefault();

    const messageInputValue: string =
      activeMessages.length === 0 ? "Start Game" : optionInput || inputValue;

    if (!messageInputValue) return;

    if (!aiRef.current) {
      toast.custom(<InstallationToast />, {
        id: "window-ai-not-detected",
      });
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: messageInputValue,
    };
    //creates a local variable to handle streaming state
    let updatedMessages: ChatMessage[] = [...messages, userMessage];
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setLoading(true);
    setInputValue("");
    setPlayerOptions([]);

    //streaming options settings for window.ai
    const streamingOptions = {
      temperature: 0.7,
      maxTokens: 1000,
      onStreamResult: (result: MessageOutput | null, error: string | null) => {
        setLoading(false);
        if (error) {
          toast.error("window.ai streaming completion failed.");
          return;
        } else if (result) {
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          // if the last message is from a user, init a new message
          if (lastMessage.role === "user") {
            updatedMessages = [
              ...updatedMessages,
              {
                role: "assistant",
                content: result.message.content,
              },
            ];
          } else {
            // if the last message is from the assistant, append the streaming result to the last message
            updatedMessages = updatedMessages.map((message, index) => {
              if (index === updatedMessages.length - 1) {
                return {
                  ...message,
                  content: message.content + result.message.content,
                };
              }
              return message;
            });
          }
          setMessages(updatedMessages);
          extractPlayerOptions(lastMessage.content);
        }
      },
    };
    //function call to window.ai to generate text, using our streaming options
    try {
      const gameTextRes = await aiRef.current.generateText(
        {
          messages: [
            { role: "system", content: gamePrompt },
            ...updatedMessages,
          ],
        },
        streamingOptions
      );
    } catch (e) {
      console.error(e);
    }
  };

  const displayMessage: ChatMessage = messages[messages.length - 1];

  const playerOptionsStart = displayMessage?.content.lastIndexOf("[|]");
  const gameTextEnd =
    playerOptionsStart > -1
      ? playerOptionsStart
      : displayMessage?.content.length;

  const gameText = displayMessage?.content.substring(0, gameTextEnd);

  return (
    <div className="flex justify-center pt-20 pb-4 px-4">
      {game.music && (
        <audio className="hidden" ref={gameMusicRef} loop controls>
          <source src={game.music} type="audio/wav" />
        </audio>
      )}
      <div className="flex flex-col">
        <div
          className={`bg-white shadow-lg rounded-lg p-6 ${
            activeView !== "start" && "hidden"
          }`}
        >
          <div className="flex flex-col">
            <div className="relative">
              <Image
                src={game.image || "/no-image.jpg"}
                width={850}
                height={1}
                alt="Game Image"
                className="rounded-lg"
              />
              <div className="flex flex-col items-center absolute bottom-7 align-center bg-black/[.6] w-full p-3">
                <div className="text-gray-100 text-3xl font-light">
                  {game.name}
                </div>
              </div>
            </div>
            <div className="flex mt-4">
              <form className="w-full" onSubmit={startGame}>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xl font-light shadow-lg active:shadow-none transition-all ${
                    loading ? "opacity-50" : ""
                  }`}
                >
                  {loading ? "Loading..." : "Start Game"}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div
          className={`bg-white overflow-hidden shadow-lg rounded-lg p-6 ${
            activeView !== "play" && "hidden"
          }`}
          style={{ width: "898px" }}
        >
          <div className="relative">
            <Image
              src={game.image || "/no-image.jpg"}
              width={850}
              height={1}
              alt="Game Image"
              className="rounded-bl-lg rounded-br-lg blur opacity-40 absolute top-2"
            />
            <div
              className="overflow-y-auto pb-4 rounded-lg font-light"
              style={{ height: "520px", maxHeight: "calc(100vh - 270px)" }}
            >
              <div className={`mb-2 whitespace-pre-wrap`}>
                <span
                  className={`inline-block p-2 rounded-lg text-left text-black text-lg inner-ol-hidden`}
                  style={{
                    filter: "drop-shadow(0 0 4px rgb(255 255 255 / 1))",
                  }}
                >
                  <ReactMarkdown>
                    {displayMessage && messages.length > 1
                      ? gameText
                      : "Loading..."}
                  </ReactMarkdown>
                </span>
              </div>
              {playerOptions.length > 0 && (
                <>
                  {playerOptions.map((option, index) => (
                    <button
                      key={index}
                      disabled={loading}
                      className={`w-full relative bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 my-1 rounded-lg shadow-lg active:shadow-none text-xl font-light transition-all`}
                      onClick={(e) => handleSendMessage(e, option)}
                    >
                      <ReactMarkdown>{option}</ReactMarkdown>
                    </button>
                  ))}
                  <div className="w-full relative bg-emerald-800 text-white px-4 py-1 my-1 rounded-lg text-lg text-center select-none shadow-lg">
                    Something else. (Type it in below)
                  </div>
                </>
              )}
              <div ref={messagesEndRef}></div>
            </div>
          </div>
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="flex relative z-30"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow bg-white/[.3] border border-gray-300 rounded-lg p-2 text-sm font-light focus:outline-none focus:border-blue-500 shadow-md transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className={`ml-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg active:shadow-none font-light transition-all`}
            >
              {loading ? (
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 text-white animate-spin dark:text-gray-600 fill-blue-500"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              ) : (
                "Go"
              )}
            </button>
          </form>
        </div>
        <div
          className={`justify-between bg-white mt-4 shadow-lg rounded-lg p-2`}
        >
          <div className="font-semibold text-lg">{game.name}</div>
          <div className="font-light text-sm">
            {game.plays} plays • {game.date}
          </div>
        </div>
        <div
          className={`flex justify-between bg-white mt-4 shadow-lg rounded-lg p-2`}
        >
          <div className="flex">
            <Image
              src={`/users/${game?.creatorId}.png`}
              width={50}
              height={50}
              alt="Game Image"
              className="rounded-3xl"
            />
            <div className="ml-2">
              <div className="font-semibold">{creator?.username}</div>
              <div className="font-light text-sm">23M Followers</div>
            </div>
            <button
              className={`bg-blue-600 hover:bg-blue-500 text-white px-2 my-2 ml-4 rounded-lg text-base font-light shadow-lg active:shadow-none`}
              onClick={() =>
                dispatch(toggleFollowUser({ user: creator, activeUser }))
              }
            >
              {creator?.followers.indexOf(activeUser.id) === -1
                ? "Follow"
                : "Following"}
            </button>
          </div>
          <div className="flex">
            <button
              className={`bg-blue-600 hover:bg-blue-500 text-white px-2 my-2 py-1 rounded-lg text-base font-light shadow-lg active:shadow-none`}
              onClick={() => dispatch(toggleLikeGame({ game, activeUser }))}
            >
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`w-6 h-6 ${
                    game?.likes?.indexOf(activeUser.id) !== -1 && "hidden"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
                  />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`w-6 h-6 ${
                    game?.likes?.indexOf(activeUser.id) === -1 && "hidden"
                  }`}
                >
                  <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" />
                </svg>
                <div className="ml-1">{game?.likes?.length}</div>
              </div>
            </button>
            <button
              className={`bg-blue-600 hover:bg-blue-500 text-white px-2 my-2 py-1 ml-2 rounded-lg text-base font-light shadow-lg active:shadow-none`}
            >
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                  />
                </svg>
                <div className="ml-1">Share</div>
              </div>
            </button>
          </div>
        </div>
        <div
          className={`bg-white mt-4 shadow-lg rounded-lg p-2`}
          style={{ maxWidth: "898px" }}
        >
          <div className="font-light text-xl mb-4">547,832 Comments</div>
          <div className="flex mb-4">
            <Image
              src={`/users/${15}.png`}
              width={50}
              height={50}
              alt="Game Image"
              className="rounded-3xl self-start"
            />
            <div className="ml-2">
              <div className="flex">
                <div className="font-semibold leading-5">
                  {users[15]?.username}
                </div>
                <div className="font-light text-sm leading-5 ml-1">
                  2 days ago
                </div>
              </div>
              <div>
                Just started playing #DojoDynasty and I'm totally hooked! 💥 The
                martial arts techniques are so detailed and realistic, it feels
                like I'm actually training in a dojo! 🥋 #MartialArtsGaming
                #NextLevelTraining
              </div>
            </div>
          </div>
          <div className="flex mb-4">
            <Image
              src={`/users/${25}.png`}
              width={50}
              height={50}
              alt="Game Image"
              className="rounded-3xl self-start"
            />
            <div className="ml-2">
              <div className="flex">
                <div className="font-semibold leading-5">
                  {users[25]?.username}
                </div>
                <div className="font-light text-sm leading-5 ml-1">
                  3 days ago
                </div>
              </div>
              <div>
                I've been immersing myself in #DojoDynasty lately, and it's
                nothing short of a martial arts masterpiece! 🔥 The journey from
                a novice to a martial arts maestro is both challenging and
                rewarding. 🥷 Can't wait to see how my martial artist journey
                unfolds! #MartialArtsMagic
              </div>
            </div>
          </div>
          <div className="flex mb-4">
            <Image
              src={`/users/${16}.png`}
              width={50}
              height={50}
              alt="Game Image"
              className="rounded-3xl self-start"
            />
            <div className="ml-2">
              <div className="flex">
                <div className="font-semibold leading-5">
                  {users[16]?.username}
                </div>
                <div className="font-light text-sm leading-5 ml-1">
                  3 days ago
                </div>
              </div>
              <div>
                I've been trying to get into #DojoDynasty, but I must say, it
                leaves a lot to be desired. 😕 While the concept is promising,
                the execution seems a bit off. I hope future updates will
                address these issues and bring more fluidity and complexity to
                the martial arts experience. 🎮
              </div>
            </div>
          </div>
          <div className="flex mb-4">
            <Image
              src={`/users/${26}.png`}
              width={50}
              height={50}
              alt="Game Image"
              className="rounded-3xl self-start"
            />
            <div className="ml-2">
              <div className="flex">
                <div className="font-semibold leading-5">
                  {users[26]?.username}
                </div>
                <div className="font-light text-sm leading-5 ml-1">
                  4 days ago
                </div>
              </div>
              <div>
                ❓Has anyone else playing this game found the character
                progression to be somewhat lacking? 🤔 I was really hoping for a
                deeper, more immersive experience where the training and
                tournaments actually reflect a true martial arts journey.
                #GamingDiscussion
              </div>
            </div>
          </div>
          <div className="flex mb-4">
            <Image
              src={`/users/${19}.png`}
              width={50}
              height={50}
              alt="Game Image"
              className="rounded-3xl self-start"
            />
            <div className="ml-2">
              <div className="flex">
                <div className="font-semibold leading-5">
                  {users[19]?.username}
                </div>
                <div className="font-light text-sm leading-5 ml-1">
                  5 days ago
                </div>
              </div>
              <div>
                I'm absolutely blown away by Dojo Dynasty! The attention to
                detail in the martial arts techniques and the immersive
                world-building is simply unparalleled. Every tournament feels
                like a crescendo of skill and strategy, pushing you to become
                the ultimate martial artist. A must-play for anyone looking for
                a rich and rewarding gaming experience! #MartialArtsMasterpiece
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default App;
