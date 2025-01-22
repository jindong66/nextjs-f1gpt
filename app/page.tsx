"use client"
import Image from "next/image"
import Logo from "./assets/logo.png"
import { useChat } from "ai/react"
import { Message } from "ai"

import Bubble from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionsRow from "./components/PromptSuggestionsRow"

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat()

    const noMessages = !messages || messages.length === 0

    const handlePrompt = (promptText) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        }
        append(msg)
    }

    return (
        <main>
            <Image src={Logo} width="250" alt="Logo" />
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The Ultimate place for Formula One super fans!
                            Ask F1GPT anything about the fantastic topic of F1 racing
                            and it will come back with the most up-to-date answers.
                            We hope you enjoy!
                        </p>
                        <br />
                        <PromptSuggestionsRow onPromptClick={handlePrompt} />

                    </>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            return <Bubble key={`message-${index}`} message={message} />;
                        })}

                        {isLoading && <LoadingBubble />}
                    </>
                )}

            </section>

            <form onSubmit={handleSubmit}>
                <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me something..." />
                <input type="submit" />
            </form>
        </main>
    )
}

export default Home