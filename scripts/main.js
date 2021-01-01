const Event = require("event");

Vars.enableConsole = true;

Events.on(ClientLoadEvent, () => {
  Vars.control.sound.ambientMusic.clear();
  Vars.control.sound.darkMusic.clear();
  Vars.control.sound.bossMusic.clear();
});

const jskebox = extend(Block, "jskebox", {
  localizedName: "JSkebox",
  description: "Jukeboxdustry but better",
  buildVisibility: BuildVisibility.shown,
  size: 2,
  destructible: true,
  update: true,
  category: Category.effect,
  alwaysUnlocked: true,
  inEditor: true,
  configurable: true,
  icons() {
    return [Core.atlas.find(this.region)];
  },
});

let paused = true,
  song = 0,
  songNames = [
    "blocks",
    "cat",
    "chirp",
    "pigstep",
    "stal",
    "wait",
    "axolotl",
    "dragon_fish",
    "shunji",
  ], // the list of your song names
  songs = songNames.map(
    (song) => loadMusic(song) // take an array of song names and load them
    // map the names to their Music() equivalent
  );

songNames = songNames.reduce((a, i, x) => {
  a[i] = { id: x };
  return a;
}, {});

const songEnd = new Event(); // event for when the song ends
songEnd.addListener(() => {
  paused = true; // set paused to true, there isn't anything to play
});

// it toggles the state of the song
function toggle() {
  paused = !paused; // invert paused
  songs[song].pause(paused); // pause/unpause the song
}

// moves forward and backwards through the song list
function seek(dir) {
  let move = dir === "next" ? 1 : -1; // if dir is  "next", move is 1. otherwise move is -1
  let newSong = song + move; // get the new song position
  if (newSong < 0) newSong = songs.length - 1; // loop back if you go past the ends
  if (newSong > songs.length - 1) newSong = 0; // loop back if you go past the ends
  play(newSong); // play the song
}

// plays a song, based on the position in the list its in
function play(id) {
  songs[song].stop(); // stop the old song
  songs[id].play(); // play the new song
  if (paused) songs[id].pause(true); // immedietly pause the song if paused is true
  song = id; // set song to the new song
}

// song selection menu
function generateMenu(menu, rebuild) {
  let menu,
    star = new TextureRegionDrawable(Icon.star.region);
  if (!menu) {
    menu = new Dialog("");
  }
  menu.clearChildren();
  menu.add("Music library").padBottom(45).center().row();
  for (let i in songNames) {
    let song = songNames[i];
    menu
      .button(i, () => {
        paused = false;
        play(song.id);
        rebuild();
      })
      .size(300, 60)
      .center();
    menu
      .button(star.tint(Color[song.favorite ? "gold" : "white"]), () => {
        song.favorite ^= true; // v e r y fancy way of inverting a value
        generateMenu(menu, rebuild);
        saveFavorites();
      })
      .size(60, 60)
      .center();
    menu.row();
  }
  menu.row();
  menu
    .button("custom", Icon.file, () => {
      menu.hide();
      readBinFile("custom music", "mp3", (e) => print(Object.keys(e)));
    })
    .size(200, 60)
    .center()
    .row();
  menu
    .button("@back", Icon.left, () => {
      menu.hide();
    })
    .size(200, 60)
    .center();
  menu.closeOnBack();
  return menu;
}

// save/load favorites list

function saveFavorites() {
  let favorites = [];
  for (let i in songNames) {
    if (songNames[i].favorite) favorites.push(i);
  }
  Core.settings.put(
    "jukebox-favorites",
    favorites.join(String.fromCharCode(0)) // this is a nul char
  );
}

function loadFavorites() {
  let favorites = Core.settings
    .get("jukebox-favorites", "")
    .split(String.fromCharCode(0));
  favorites.forEach((i) => {
    if (i) songNames[i].favorite = true;
  });
}

jskebox.buildType = () =>
  extend(Building, {
    buildConfiguration(table) {
      this.rebuild(table);
    },
    rebuild(table) {
      table.clearChildren();

      let controls = new Table();
      // function to add a button to the table
      function addButton(icon, scale, func) {
        // scale is for the icon size, play button is a little small
        controls
          .button(
            new TextureRegionDrawable(Icon[icon].region, scale), // get the icon
            Styles.clearTransi, // use the clear/transparent style
            func // run the given function on click
          )
          .size(45);
      }

      function rebuild() {
        this.rebuild(table);
      }

      // previous song button
      addButton(
        "left",
        1,
        () => seek("prev") // use the seek function to go to the previous song
      );

      // play/pause buttons
      addButton(
        !paused ? "pause" : "play", // is "pause" if paused is true, otherwise "play"
        // google "ternary operator"
        5,
        () => {
          toggle(); // toggle pause on press
          this.rebuild(table); // rebuild the table to update the button
        }
      );

      // previous song button
      addButton(
        "right",
        1,
        () => seek("next") // use seek to go to next song
      );

      table.add(controls);
      table.row();
      table
        .button(
          new TextureRegionDrawable(Icon.list.region, 3),
          Styles.clearTransi,
          () => generateMenu(null, () => this.rebuild(table)).show()
        )
        .size(45)
        .width(45 * 3)
        .center();
      table.row();
    },
  });

Events.run(ClientLoadEvent, () => {
  play(0); // preload a song
  loadFavorites();
});
