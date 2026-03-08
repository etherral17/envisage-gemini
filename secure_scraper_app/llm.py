def summarize(text):

    words = text.split()

    summary = " ".join(words[:100])

    return summary