const pongCode = `
cmp &0 1      # check to see if global variables have already been declared
jeq :start

# declare global variables
mov 287 &1    # screen width
mov 112 &2    # player Y
mov 112 &3    # AI Y
mov 144 &4    # ball x
mov 112 &5    # ball y
mov -3  &6    # ball vel x
mov 5   &7    # ball vel y
mov 0   &8    # miss flash counter
mov 0   &9    # random seed

mov 1 &0      # set flag so that we never run the above code again

:start
    sub vb 0
    jeq :drawLine()          # draw game when not v-blanking
    jmp :updateGame()        # update game when v-blanking
    end

:updateGame()
    # update player paddle
    mov &inp &2              # copy input value to player paddle Y position

    # update AI paddle
    sub &5 &3                # get the difference between player paddle and ball, which gives us the direction
    min res 3                # clamp max paddle speed to 3
    add res &3               # add velocity to paddle Y
    min res 174              # clamp paddle to top and bottom of screen
    max res 50               # clamp paddle to top of screen
    mov res &3               # set the AI paddle's Y to the final clamped result

    call :updateBall()

    # reset ball position and assign random velocity
    cmp &8 1                 # If the screen is about to stop flashing, reset the ball's position
    jne :flashScreen
    mov 144 &4               # reset ball to initial X pos
    mov 112 &5               # reset ball to initial Y pos
    call :getRandomSign()
    mul r1 &6                # multiply the ball's X velocity by random sign
    mov res &6               # set ball's X velocity to result
    call :getRandomSign()
    mul r1 &7                # multiply the ball's Y velocity by random sign
    mov res &7               # set ball's Y velocity to result

    :flashScreen
    cmp &8 0                 # Only flash screen if flash counter is greater than 0
    jeq :updateGameEnd
    sub &8 1                 # decrement flash counter
    mov res &8
    
    :updateGameEnd
    add 1 &9                 # increment random seed
    mov res &9
    end

:updateBall()
    push -1               # bounce X dir
    push -1               # bounce Y dir
    
    # update position
    add &6 &4             # add ball X velocity to X position
    mov res &4
    add &7 &5             # add ball Y velocity to Y position
    mov res &5

    # bounce off top/bottom
    cmp &5 218            # check if ball is above the top of the screen
    jgt :bounceY
    mov 1 $0              # set bounce X dir to positive 1
    cmp &5 5              # check if ball is below bottom of the screen
    jlt :bounceY
    jmp :checkPlayer      # skip :bounceY if the above checks failed

    :bounceY
    abs &7                # get the absolute value of the ball's Y velocity
    mul res $0            # multiply that value by the bounce Y direction
    mov res &7            # store the result in the ball's Y velocity

    :checkPlayer
    cmp &4 24             # skip checking player collision if ball is too far right
    jgt :checkAI
    # check player collision
    push ret              # cache ret value before calling :sampleRect() function
    push 15               # set param rect center X to the player paddle's X position
    push &2               # set param rect center Y to the player paddle's Y position
    sub &4 4              # subtract 4 from the ball's X position to get the left edge of the ball
    push res              # set param X pos to sample the left edge of the ball
    push &5               # set param Y pos to sample the ball's height
    push 5                # set param width to half the width of the paddle
    push 50               # set param height to half the height of the paddle
    call :sampleRect()
    mov $6 ret            # restore cached ret value
    pop 7
    cmp r1 1              # check if sample hit
    jlt :checkAI          # skip bounce if no hit
    mov 1 $1              # set bounce X dir to +1 before bouncing
    jmp :bounceX

    :checkAI
    cmp &4 164            # skip checking AI paddle collision if ball is too far left
    jlt :checkOOB
    # check AI collision
    push ret              # cache ret value before calling :sampleRect() function
    push 273              # set param rect center X to the AI paddle's X position
    push &3               # set param rect center Y to the AI paddle's Y position
    add &4 4              # add 4 to the ball's X position to get the right edge of the ball
    push res              # set param X pos to sample the right edge of the ball
    push &5               # set param Y pos to sample the ball's height
    push 5                # set param width to half the width of the paddle
    push 50               # set param height to half the height of the paddle
    call :sampleRect()
    mov $6 ret            # restore cached ret value
    pop 7
    cmp r1 1              # check if sample hit
    jlt :checkOOB         # skip bounce if no hit
    mov -1 $1             # set bounce X dir to -1 before bouncing
    jmp :bounceX

    :bounceX
    abs &6                # get absolute value of ball's X velocity
    mul res $1            # multiply that value by the bounce X direction
    mov res &6            # store the result in the ball's X velocity

    :checkOOB
    cmp &8 0              # skip if screen is flashing
    jgt :updateBallEnd
    cmp &4 -4             # check if ball is off the left side of the screen
    jle :ballMissed
    cmp &4 292            # check if ball is off the right side of the screen
    jgt :ballMissed       # trigger ball-missed effect
    jmp :updateBallEnd    # skip ball-missed effect

    :ballMissed
    mov 7 &8              # set the screen to flash a specific number of times

    :updateBallEnd
    pop 2
    ret

:drawLine()
    push 0     # pixelIdx
    push 0     # video mem addr

    :renderLine
        # calc memory addr
        add vm $1             # Add screen width to pixelIdx to get video memory address
        mov res $0            # store result in stack
        mov 0 r3              # initialize r3 to 0 (will be used to store pixel "hit" value)

        # skip paddle drawing if we're flashing
        div &8 2              # divide paddle counter by 2
        push res
        rnd res               # round result
        push res
        sub $1 $0             # take the difference between the divided and rounded result, leaving only the fractional value
        abs res
        pop 2
        jgt :setPixelValue    # if the fractional value is greater than 1 (i.e. number is odd) skip drawing the paddles

        # skip player paddle drawing if we're too far right
        cmp $1 20
        jgt :drawAIPaddle

        # get player paddle result
        push 15               # set param rect center X to the player paddle's X position
        push &2               # set param rect center Y to the player paddle's Y position
        push $3               # set param X pos to sample the current screen X
        push vl               # set param Y pos to sample the current screen Y
        push 5                # set param width to half the width of the paddle
        push 50               # set param height to half the height of the paddle
        call :sampleRect()
        pop 6
        max r1 r3             # take the maximum of the hit result and current hit result
        mov res r3            # store result in r3

        :drawAIPaddle
        # skip AI paddle drawing if we're too far left
        cmp $1 268
        jlt :drawBall

        push 273              # set param rect center X to the AI paddle's X position
        push &3               # set param rect center Y to the AI paddle's Y position
        push $3               # set param X pos to sample the current screen X
        push vl               # set param Y pos to sample the current screen Y
        push 5                # set param width to half the width of the paddle
        push 50               # set param height to half the height of the paddle
        call :sampleRect()
        pop 6
        max r1 r3             # take the maximum of the hit result and current hit result
        mov res r3            # store result in r3

        :drawBall
        # skip drawing ball if not in range
        sub &4 4              # check if less than ball's left edge
        cmp $1 res
        jlt :setPixelValue
        add &4 4              # check if greater than ball's right edge
        cmp $1 res
        jgt :setPixelValue

        push &4               # set param rect center X to the ball's X position
        push &5               # set param rect center Y to the ball's Y position
        push $3               # set param X pos to sample the current screen Y
        push vl               # set param Y pos to sample the current screen Y
        push 4                # set param width to half the width of the ball
        push 4                # set param height to half the height of the ball
        call :sampleRect()
        pop 6
        max r1 r3             # take the maximum of the hit result and current hit result
        mov res r3            # store result in r3
        
        :setPixelValue
        mov r3 &$0            # set the memory address referenced by the value of the first item in the stack (the current video memory address)
        
        # increment pixelIdx and loop
        add 1 $1
        mov res $1
        cmp $1 &1
        jle :renderLine

    pop 2

    end

:sampleRect()
    # @param rect center X
    # @param rect center Y
    # @param X pos to sample
    # @param Y pos to sample
    # @param width
    # @param height
    # @out r1 = hit result

    sub $3 $5     # subtract x pos from screen x
    abs res       # abs result
    sub res $1    # subtract width from result
    mov res r1    # store in r1

    sub $2 $4     # subtract y pos from screen y
    abs res       # abs result
    sub res $0    # subtract height from result
    mov res r2    # store in r2

    max r1 r2     # take max
    mul res -1    # invert
    min res 1     # clamp
    max res 0     # clamp

    mov res r1
    ret

:getRandomSign()
    # calculates random
    # @out r1 = random 1 or -1

    mul &2 &9     # multiply player Y by random seed
    div res 2     # divide result by 2
    mov res r1    # store result in r1
    rnd res       # round result
    mov res r2    # store result in r2
    sub r1 r2     # take difference between r1 and r2
    cmp res 0     # check if result (decimal remainder) is equal to 0
    jne :getRandomSignEnd
    mov 1 res     # if equal to zero, set to 1

    :getRandomSignEnd
    mov res r1    # set r1 output to the result of the above comparison
    add &9 1      # increment random seed
    mov res &9
    ret
`;