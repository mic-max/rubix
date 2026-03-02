# Rubix Cube

A webpage where you can set the state of a rubix cube and solve it.

## References
- https://jperm.net/3x3/moves

## Themes
- [Default](https://flatuicolors.com/palette/ca)

## Tips
- If you are solving a cube that someone sent you a link to and you want to try again, refresh the webpage.
    - There should be a reset button for this instead of making another full request though.

## To do

- Add a footer with author information and a link to create bug report or feature requests to the GitHub repository.

- Add a solve button. When pressed it will calculate a way to solve it, perform the actions, and they will be listed in the move history.

- Add a timer
    - User presses spacebar to start, or first move starts the stopwatch
    - modes where you have limited time to look at the cube before the game time starts ticking away
    - personal highscore tracking

- When hovering a polygon that you can scroll or click on change the cursor to the 4 direction pointer.
- Make the share button more modern, and change cursor to copy when hovering?
- When hovering buttons like B and F change the cursor to an arrow that points in the direction of movement? or just add a little diagram of the actual move.

add a multi select for selecting the input mode.
hovering a face and press w,a,s,d to rotate.

- in paint mode start each face as white? less painting required that way.
- in paint mode, propose a cube state once a certain amount of colours have been added?

- Test that the move buttons all do the correct thing. The scrolling and clicking actions all match the cube but might have the prime and non-prime swapped.
- Add tests

when hovering the top face show what w,a,s,d do since it could be unclear.
to validate a cube, to shuffle a cube
preferences (shuffle cube delay in ms between each move)

- reveal X on hovered face
  - use vertices to construct it so it looks 3d

- query parameters to set debug mode, selected algorithm, etc.
    - share button to also send options and history to someone else?
    - because modifying the url after every action might not be a good thing to do

- button arrows along the perimeter of each cube on every face pointing out
    - include the keycode like R, R', U, U', etc.

- move history
    - similarly to the chrome dev console, for multiple consecutive same moves add a (x2) pill
        - move codes wrap around from nothing to U to U2 to U' to nothing
    - add a copy button that copies to clipboard in a useful text or binary format?
    - buttons to advance and go back in the move queue
- input so you can paste moves and have them be executed on the cube.

- Add auto-detect system light mode/dark mode and remember the user preferences?

- Add i18n, other language support

- Add a button to show how shuffled the current cube is. aka how many steps to optimally solve it. Max is 20 iirc.

- Add a meta description, included in stuff like search results.

- Add embed images media stuff, so if shared on discord or twitter it shows a better looking link?
    - To make a custom image I think we'd have to make a smarter server, maybe the copy link sends an HTTP request to load the cube state on the server and save image of that cube. which then gets pushed to some static file server?

- Improve the accessibility score for https://pagespeed.web.dev/analysis/https-rubix-micmax-pw/4ox7b0s1k9?form_factor=desktop

- simple way of manipulating the cube
  - how many moves are there in total:
    - up down right left front back: 6
    - prime for all those: 6
    - number 2 means turn that face twice: 6 (optional)
    - create a complete map of start faces to end faces after each move

- Drag UI
    - Essentiall is just 9 hitboxes and depending on if your cursor begins moving
    - up/down vs. left/right it will select the correct one

- Add keyboard shortcuts for toggles and buttons and a shortcuts help page
  - Press 1 to enable debug, 2 to enable wonky, etc.

- Show HEX colour picker on launch instead of RGB. Might have no native way to do so yet.
- Gradient themes

- Remake the favicon. Different sizes?

26 pieces
- 8 corners
- 12 edges
- 6 center pieces

edge parity
corner parity
swap parity

https://youtu.be/hMPn64NbLdk

make the toggle buttons look nicer for debug and wonky mode.
- it would be cool if wonky mode had an irregular shaped border made up of several line segments that roughly followed a rectangle. when disabled the wonky mode input button is rectangle, enabled it is wonky rectangle, similar to the vertices of the cube.

- localStorage interaction layer
- Cloudflare Pages: Server side analytics
- Make a nice dev workflow, with `npm run dev` which hotreloads and runs my build.js script.

- Add a shuffle from solved button

- Make the shuffle moves button closer tied with the number input for how many moves to randomly execute.

- Serve from a local basic HTTP server so I can hotload the dist/index.html and enables me to use JavaScript workers.

- Is solves function should emulate the function that sets the starting cube state. Except that with the X, Y, Z rotations and middle moves allowed that actually makes the isSolved function harder. maybe we simulate a few of the X,Y,Z moves until the middle sticker matches the original starting middle squares?

- Do not generate all the possible solutions using a BFS search. Just hardcode the X,Y,Z rotations required instead.

- Add an application manifest "defines how your app appears on phone's home screens and what the app looks like on launch"
- Add mobile support

## Testing

create a test script that keeps existing functions
- select a random point inside each of the horizontalPolygons and left and right click. they should both change the cube and doing both consecutively should bring the cube back to the original state. it should also increase the move count. it should add a move to the move history.
- select random point inside each of the verticalPolygons and scroll up and scroll down. cube should update.

- click a move button in bottom panel

- Verify the solver by pressing the shuffle button with different amounts of moves, and then the solve button, which should solve it.
    - Do this over and over and verify that the cube does look solved.

## Performance

- Test webpage load times
- Test how long solves take on average, build a chart
