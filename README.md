# Rubix Cube

A webpage where you can set the state of a rubix cube and solve it.

## Brainstorm

https://stackoverflow.com/questions/16089421/how-do-i-detect-keypresses-in-javascript

https://jperm.net/3x3/moves

- "Add M and X moves" - boulajp

add a timer. user presses spacebar to start, or first move starts the stopwatch
- modes where you have limited time to look at the cube before the game time starts ticking away
- leaderboard system

add a multi select for selecting the input mode.
hovering a face and press w,a,s,d to rotate.

highlight currently hovered segment of the cube. ie hovering face 1. change the stroke on the blue left column and top 1,2,3 faces.

when hovering the top face show what w,a,s,d do since it could be unclear.
to validate a cube, to shuffle a cube
preferences (shuffle cube delay in ms between each move)

- reveal X on hovered face
  - use vertices to construct it so it looks 3d

- query parameters to set debug mode, selected algorithm, etc.
    - share button to send current state and options and history to someone else (done through query params)
    - because modifying the url after every action might not be a good thing to do

- button arrows along the perimeter of each cube on every face pointing out
    - include the keycode like R, R', U, U', etc.

- recent move queue at bottom of screen that scrolls as it fills
    - similarly to the chrome dev console, for multiple consecutive same moves add a (x2) pill
        - move codes wrap around from nothing to U to U2 to U' to nothing
    - add a copy button that copies to clipboard in a useful text or binary format?
    - buttons to advance and go back in the move queue
- input so you can paste moves and have them be executed on the cube.

- simple way of manipulating the cube
  - how many moves are there in total:
    - up down right left front back: 6
    - prime for all those: 6
    - number 2 means turn that face twice: 6 (optional)
    - create a complete map of start faces to end faces after each move


- Drag UI
    - Essentiall is just 9 hitboxes and depending on if your cursor begins moving
    - up/down vs. left/right it will select the correct one

- html, css, js linting/pretty + uglify
- map all buttons to a key press ex: (num row 1-9)