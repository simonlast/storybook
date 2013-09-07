##Storybook

[Try it out here.](http://storybook.simonlast.org)

This document describes the design of the Storybook environment. For visual examples of the functionality of each button, press the [lightbulb icon](http://storybook.simonlast.org).

##Definitions

###Sprite

A Sprite is a user-generated image which is attached to the canvas. Sprites are created using a Sprite button. A sprite will always be associated with the button that created it.

###Button

Buttons are the basic element of a Storybook program. Buttons can be activated, causing an operation to occur. 

For example, when the "move" button is activated, it causes a sprite to move.

###Connection

Any two buttons can be connected with a directed link. This is accomplished by selecting a button, and dragging from the protruding circle at its base to another button.

##Evaluation

###Activation Step

When a button becomes activated, it performs an operation. Activation is always in the context of a Sprite.

###Propagation Step

After activation, a Button will enter its propagation step. This will activate all of its outbound connections. These outbound activations will preserve the sprite which the operation was associated with.

The propagation step does not have to ocurr immediately after the activation step. For example, the Timer button will wait for one second between its activation step and propagation step. This allows for basic conditional functionality.

###Flow

The flow of a Storybook program always begins at the Sprite buttons. Pressing any button will re-evaluate the program, activating each Sprite button in parallel.