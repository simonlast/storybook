
##This document describes the functionality of Storybook.

###Sprite

A Sprite is a user-generated image, attached to the canvas. Sprites are created using the Sprite button. A sprite will always be associated with the button that created it.

###Button

Buttons are the basic element of a Storybook program. Buttons can be activated, causing an operation to occur. For example, when the "move" button is activated, it causes a sprite to move.

[video of move button]

###Connection

Buttons can be connected using a directed link.

[photo of link to right, link to left, and undirected link]

###Activation Step

When a button becomes activated, it performs an operation. Activation is always in the context of a Sprite.

###Propagation Step

After activation, the Button will enter its propagation step. This will activate all of its outbound connections. The activation step does not have to ocurr immediately after the activation step. For example, the Timer button will wait for one second between its activation step and propagation step.


###Chain

To form a Storybook program, buttons are connected using a directed link.

###Flow

The flow of a Storybook program always begins at the Sprite buttons. At the beginning of the program, each Sprite button is activated in parallel.