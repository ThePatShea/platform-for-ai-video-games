import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import InstallationToast from "@/components/toast";
import { ChatMessage, MessageOutput, WindowAI, getWindowAI } from "window.ai";
import { useDispatch, useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/router";
import Image from "next/image";

import { addGame } from "../reducers/globalSlice";

const App: React.FC = () => {
  const [gameIdeaInput, setGameIdeaInput] = useState<string>("");
  const [activeView, setActiveView] = useState<string>("create");
  const [loading, setLoading] = useState<boolean>(false);
  const [gameIdea, setGameIdea] = useState<string>("");
  const [gameColor, setGameColor] = useState<string>("");
  const [gameName, setGameName] = useState<string>("");
  const [gameImageUrl, setGameImageUrl] = useState<string>("");
  const [gameMusicUrl, setGameMusicUrl] = useState<string>("");

  const dispatch = useDispatch();
  const router = useRouter();

  const games = useSelector((state) => state.global.games);

  const aiRef = useRef<WindowAI | null>(null);

  const generateGameMusic = async () => {
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${process.env.NEXT_PUBLIC_LEAP_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: `A whimsical, playful melody for an 8-bit video game where ${
          gameIdea || gameIdeaInput
        }.`,
        mode: "melody",
        duration: 30,
      }),
    };

    fetch(`https://api.tryleap.ai/api/v1/music`, options)
      .then((response) => response.json())
      .then((response) => {
        getGameMusic(response.id);
      })
      .catch((err) => console.error(err));
  };

  const getGameMusic = async (inferenceId: string) => {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${process.env.NEXT_PUBLIC_LEAP_API_KEY}`,
      },
    };

    fetch(`https://api.tryleap.ai/api/v1/music/${inferenceId}`, options)
      .then((response) => response.json())
      .then((response) => {
        if (!response.media_uri) {
          console.log("no music yet");

          setTimeout(() => {
            getGameMusic(inferenceId);
          }, 1000);
        } else {
          setGameMusicUrl(response.media_uri);
        }
      })
      .catch((err) => console.error(err));
  };

  const generateGameImage = async () => {
    const modelId = "37d42ae9-5f5f-4399-b60b-014d35e762a5";

    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${process.env.NEXT_PUBLIC_LEAP_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: `The title screen (with no text and no logo) for a video game where ${
          gameIdea || gameIdeaInput
        }. Pixar, concept art, 3d digital art, Maya 3D, ZBrush Central 3D shading, bright colored background, radial gradient background, cinematic, Reimagined by industrial light and magic, 4k resolution post processing`,
        negativePrompt:
          "deformed iris, deformed pupils, text, logo, logos, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck",
        steps: 100,
        width: 1024,
        height: 600,
      }),
    };

    fetch(
      `https://api.tryleap.ai/api/v1/images/models/${modelId}/inferences`,
      options
    )
      .then((response) => response.json())
      .then((response) => {
        getGameImage(response.id, modelId);
      })
      .catch((err) => console.error(err));
  };

  const getGameImage = async (inferenceId: string, modelId: string) => {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${process.env.NEXT_PUBLIC_LEAP_API_KEY}`,
      },
    };

    fetch(
      `https://api.tryleap.ai/api/v1/images/models/${modelId}/inferences/${inferenceId}`,
      options
    )
      .then((response) => response.json())
      .then((response) => {
        if (response.images.length === 0) {
          console.log("no image yet");

          setTimeout(() => {
            getGameImage(inferenceId, modelId);
          }, 1000);
        } else {
          setGameImageUrl(response.images[0].uri);
        }
      })
      .catch((err) => console.error(err));
  };

  const createGame = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    generateGameAttribute("color");
    generateGameAttribute("name");
    setGameIdea(gameIdeaInput);
    generateGameMusic();
    generateGameImage();

    setActiveView("generating");
  };

  const attributePrompts = {
    name: `
      You are a video game name generator.
      
      You will generate a name for a video game based on the description of the game that the user inputs.

      The name will have exactly 2 words, with a space in between the 2 words.
      
      You will only return one name for the video game.

      You will not include anything else in your response, other than the name of the video game.

      You will not include any quotation marks or punctuation in your response.
    `,
    color: `
      You are a video game color picker.

      Here is the list of colors: gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose

      You will choose one color from the list of colors that best matches the video game idea provided.

      You will only choose from the list of colors. You will never choose a color that is not on the list.

      You will respond only with the name of the color.
    `,
  };

  const gamePrompt = `
    You are a game called ${gameName}.

    ${gameName} is a game where ${gameIdea || gameIdeaInput}.

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

    At the end of EVERY step of the game, you will ask the user what they would like to do, and give the player suggestions for some things they can do. You will format these suggestions in a numbered list.
    
    You will format the list EXACTLY LIKE THESE EXAMPLES:
    --------------------
    Example 1:
    __________
    1. Option 1
    2. Option 2
    3. Option 3
    4. Something else.
    __________

    Example 2:
    __________
    1. First Option
    2. Second Option
    3. Third Option
    4. Something else.
    __________

    Example 3:
    __________
    1. Option One
    2. Option Two
    3. Option Three
    4. Something else.
    __________
    --------------------
    Then, you will remind them that these are only suggestions. They can also do anything else they want to do in the boundless world of the game.

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

  useEffect(() => {
    const newGameId = games.length;

    if (gameIdea && gameColor && gameName && gameImageUrl && gameMusicUrl) {
      const newGame = {
        id: newGameId,
        image: gameImageUrl,
        music: gameMusicUrl,
        color: gameColor,
        name: gameName,
        idea: gameIdea,
      };

      console.log("newGame", JSON.stringify(newGame, null, 4));

      dispatch(addGame(newGame));

      router.push(`/play/${newGameId}`, undefined, { shallow: true });
    }
  }, [gameIdea, gameColor, gameName, gameImageUrl, gameMusicUrl]);

  const generateGameAttribute = async (attribute: string) => {
    if (!aiRef.current) {
      toast.custom(<InstallationToast />, {
        id: "window-ai-not-detected",
      });
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: `a game where ${gameIdea || gameIdeaInput}`,
    };
    let updatedMessages: ChatMessage[] = [userMessage];
    setLoading(true);

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
        }
      },
    };

    //function call to window.ai to generate text, using our streaming options
    try {
      const gameNameRes = await aiRef.current.generateText(
        {
          messages: [
            { role: "system", content: attributePrompts[attribute] },
            ...updatedMessages,
          ],
        },
        streamingOptions
      );

      if (attribute === "color") {
        setGameColor(gameNameRes[0].message.content);
      } else if (attribute === "name") {
        setGameName(gameNameRes[0].message.content);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className={`w-full sm:w-3/4 lg:w-1/2 xl:w-1/2 bg-white shadow-lg rounded-lg p-6 ${
          activeView !== "create" && "hidden"
        }`}
      >
        <form onSubmit={createGame}>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            A game where...
          </label>
          <textarea
            onChange={(e) => setGameIdeaInput(e.target.value)}
            rows="8"
            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-all dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 font-light"
            placeholder="Write your game idea."
          ></textarea>
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-600 hover:bg-blue-500 transition-all text-white px-4 py-2 rounded-lg text-sm font-light shadow-lg active:shadow-none ${
                loading ? "opacity-50" : ""
              }`}
            >
              {loading ? "Sending..." : "Create Game"}
            </button>
          </div>
        </form>
      </div>
      <div
        className={`w-full sm:w-3/4 bg-white shadow-lg rounded-lg p-6 ${
          activeView !== "generating" && "hidden"
        }`}
      >
        <div className="flex flex-col items-center">
          <div className="text-xl mb-4 font-light">Creating Game...</div>
          <div>
            <svg
              aria-hidden="true"
              className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
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
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default App;
