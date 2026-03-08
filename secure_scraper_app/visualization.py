import os
import matplotlib
matplotlib.use('Agg')  # Set non-interactive backend before importing pyplot
from wordcloud import WordCloud
import matplotlib.pyplot as plt

from config import WORDCLOUD_PATH


def create_wordcloud(text, api_key):
    if not text or not text.strip():
        raise ValueError("cannot generate wordcloud for empty text")

    wc = WordCloud(width=800, height=400).generate(text)

    # ensure output directory exists
    os.makedirs(WORDCLOUD_PATH, exist_ok=True)
    path = f"{WORDCLOUD_PATH}/{api_key}_wordcloud.png"

    plt.figure(figsize=(10, 5))
    plt.imshow(wc)
    plt.axis("off")

    plt.savefig(path)
    plt.close()  # Close the figure to free memory

    return path