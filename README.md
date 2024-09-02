# Finite Craft

Like the beloved [Infinite Craft](https://neal.fun/infinite-craft/) but:

- Probably more boring
- None of the recipes of the original game work here. You'll have to discover stuff yourself. On the bright side: all the first-discoveries are yours for the taking.
- Open-source under the MIT license
- Run it on your shitty laptop
  - Explanation: Infinite Craft _allegedly_ [uses LLaMa] and a cloud service geared specifically towards AI workloads to make the magic happen.
    Mine was made with business/low end laptops with no GPU in mind.

Play it online here: [GitHub CodeSpace port forward](https://fluffy-winner-45ggvrw5x6f5qq9-5000.app.github.dev/)

## How is it possible?

One word. [Guidance](https://github.com/guidance-ai/guidance/). This nifty little library lets you
"proompt" models unlike anything you've seen before. No more unexpected gibberish, no more wrangling with
prompts to get the right format for your output. You can constrain the ouput of a model to a specific format,
you can even write grammars with this thing.

Though, I didn't use it to its full potential here to be fair.
What's best about this library is that after it's parsed a prompt, subsequent queries with variations of the same prompt
(depends on how you structure your program really) will be way faster than the first one.
Once you get past the initial overhead of consuming the prompt, you can generate text faster than you can click
the infamous "I'm not a robot" checkbox.

For the task of generating `<item> + <item> = ?` and `appropriate emoji for <item> = ?`, it's a godsend,
and sets this project apart from all the other clones (very few) out there that either
pay for OpenAI's API or struggle with the heavy cost of local models.

## How to run

```sh
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
MODEL_PATH=/wherever/your/llama-cpp/gguf-model/is-located/model.gguf python3 app.py
```

For PowerShell (Windows):
```powershell
# mostly the same commands, but a little different
python3 -m venv venv
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
./venv/bin/Activate.ps1
$env:MODEL_PATH='C:\Path\To\Your\Model.gguf'
python3 app.py
```

For this initial version, you can disregard Flask's nagging.
No, you don't need a dedicated multi-threaded wrapper like Gunicorn or uWSGI.
For now.

First, the server will warm-up by generating three or four word combinations (not remembered)
and some emojis too. This is to get the models ready, and avoid latency for visitors.
Only then will the server start, on port 5000.

You can use [ngrok](https://ngrok.com/) or `cloudflared` (no link, google it) to expose your local server to the internet
and play with friends.

### Recommended LLMs

I've developed this with the following models in mind:

- [Mistral 7b OpenOrca Q5_K_M](https://huggingface.co/TheBloke/Mistral-7B-OpenOrca-GGUF/tree/main)
  - slow to start, but works surprisingly well. Will use in production (not right now today, be patient).
- [Phi-3 Mini 128k Instruct Q4 K_M](https://huggingface.co/MoMonir/Phi-3-mini-128k-instruct-GGUF/tree/main)
  - main thing I used for dev. Good trade-off between fast and reliable.
- [Phi-3 Mini 4k Instruct Q4](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/tree/main)
  - Ehh. Was fast-ish for developing.
- [OpenELM-1 1B Instruct - either Q5 K_M or Q8](https://huggingface.co/LiteLLMs/OpenELM-1_1B-Instruct-GGUF/tree/main)
  - Very fast. Not very smart. Phi-3 gets hailed as the best for mobile devices, but this is the real deal.
    Unfortunately, you need `llama_cpp_python>=0.2.82` for this to work.
    And [guidance doesn't work too well with this version for this specific app I've made](https://github.com/guidance-ai/guidance/issues/859).
    If you want to use this, then wait, I guess. It's not like the others are too damn slow.

You can use any model you want, but the ones above are the ones I've tested with.

## Roadmap and known bugs

Here's plans:

- [x] Store the emojis in a DB as well, for consistent results and less prompting.
  - And a fundamental difference between this game and the original: in the original, items are considered distinct by their word-emoji combo.
    Only the word matters in my version though.
- [x] Fix the resize bug. The original handles this by just squeezing your items within the canvas whenever you resize.
- [x] Make it playable on mobile.
- [ ] A bit more styling for better UX.
- [ ] Dockerize
- [ ] Flask ratelimit plugin
- [ ] Host this somewhere. But not yet - see above.

[uses LLaMa]: https://www.gameleap.com/articles/does-infinite-craft-use-ai-explained
