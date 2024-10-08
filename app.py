#!/usr/bin/env python3
import dbm
from datetime import datetime

from flask import Flask, render_template, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from craft import existing_or_generate, prepare_db, make_emoji, existing_emoji_or_generate, try_combo

app = Flask(__name__)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["2000 per day", "400 per hour"],
    storage_uri="memory://",
)

ingredient_db = {}
combos_db = {}
emoji_db = {}

@app.get('/')
def index():
    return render_template('index.html')

@app.post('/craft')
def craft():
    first = request.json['first']
    second = request.json['second']
    combo, first_discovery = existing_or_generate(ingredient_db, combos_db, first, second)
    if combo == None:
        return { 'error': 'Not found' }, 404
    emoji = existing_emoji_or_generate(emoji_db, combo)
    return { 'combo': combo, 'first_discovery': first_discovery, 'emoji': emoji }


if __name__ == '__main__':
    ingredient_db = dbm.open('data/ingredients.db', 'c')
    combos_db = dbm.open('data/combos.db', 'c')
    emojis_db = dbm.open('data/emojis.db', 'c')
    prepare_db(ingredient_db, combos_db)

    # warm up
    print('Warming up')
    start = datetime.now()
    print(try_combo('fire', 'water')) # steam
    print(try_combo('earth', 'water')) # mud
    print(try_combo('air', 'earth')) # dust
    # emoji warm up
    print("Emoji for steam", make_emoji('steam'))
    print("Emoji for mud", make_emoji('mud'))
    print("Emoji for dust", make_emoji('dust'))
    end = datetime.now()
    print('Warmed up in', end - start)

    app.run(host='0.0.0.0', port=5000, threaded=False)
