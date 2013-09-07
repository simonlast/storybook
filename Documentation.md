##Storybook

###Sprite

A Sprite is a user-generated image, attached to the canvas. Sprites are created using the Sprite button. A sprite will always be associated with the button that created it.

###Button

Buttons are the basic element of a Storybook program. Buttons can be activated, causing an operation to occur. For example, when the "move" button is activated, it causes a sprite to move.

###Connection

Any two buttons can be connected using a directed link. This is accomplished by selecting a button, and dragging from the protruding circle at its base to another button.

###Activation Step

When a button becomes activated, it performs an operation. Activation is always in the context of a Sprite.

###Propagation Step

After activation, the Button will enter its propagation step. This will activate all of its outbound connections. The activation step does not have to ocurr immediately after the activation step. For example, the Timer button will wait for one second between its activation step and propagation step. This allows for basic conditional functionality in the system.

###Flow

The flow of a Storybook program always begins at the Sprite buttons. At the beginning of the program, each Sprite button is activated in parallel.