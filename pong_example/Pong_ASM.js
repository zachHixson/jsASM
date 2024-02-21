const pongCode = `
cmp &0 1
jeq :start

# declare global variables
mov 287 &1    # screen width
mov 112 &2    # player Y
mov 112 &3    # AI Y
mov 144 &4    # ball x
mov 112 &5    # ball y
mov -3   &6   # ball vel x
mov 5   &7    # ball vel y
mov 0   &8    # miss flash counter
mov 0   &9    # random seed

mov 1 &0

:start
    sub vb 0
    jeq :drawLine()
    jmp :updateGame()
    end

:updateGame()
    # update player paddle
    mov &inp &2

    # update AI paddle
    sub &5 &3
    min res 3    #clamp speed to 3
    add res &3
    min res 174
    max res 50
    mov res &3

    call :updateBall()

    #reset ball position
    cmp &8 1
    jne :flashScreen
    mov 144 &4
    mov 112 &5
    call :getRandomSign()
    mul r1 &6
    mov res &6
    call :getRandomSign()
    mul r1 &7
    mov res &7

    :flashScreen
    cmp &8 0
    jeq :updateGameEnd
    sub &8 1
    mov res &8
    
    :updateGameEnd
    add 1 &9
    mov res &9
    end

:updateBall()
    push -1    # bounce X dir
    push -1    # bounce Y dir
    
    #update position
    add &6 &4
    mov res &4
    add &7 &5
    mov res &5

    #bounce off top/bottom
    cmp &5 218
    jgt :bounceY
    mov 1 $0
    cmp &5 5
    jlt :bounceY
    jmp :checkPlayer

    :bounceY
    abs &7
    mul res $0
    mov res &7

    :checkPlayer
    cmp &4 24
    jgt :checkAI
    cmp &4 11
    jlt :checkAI
    # check player collision
    push ret
    push 15
    push &2
    sub &4 4
    push res
    push &5
    push 5
    push 50
    call :sampleRect()
    mov $6 ret
    pop 7
    cmp r1 1
    jlt :checkAI
    mov 1 $1
    jmp :bounceX

    :checkAI
    cmp &4 164
    jlt :checkOOB
    # check AI collision
    push ret
    push 273
    push &3
    add &4 4
    push res
    push &5
    push 5
    push 50
    call :sampleRect()
    mov $6 ret
    pop 7
    cmp r1 1
    jlt :checkOOB
    mov -1 $1
    jmp :bounceX

    :bounceX
    abs &6
    mul res $1
    mov res &6

    :checkOOB
    cmp &8 0
    jgt :updateBallEnd
    cmp &4 -4
    jle :ballMissed
    cmp &4 292
    jgt :ballMissed
    jmp :updateBallEnd

    :ballMissed
    mov 7 &8

    :updateBallEnd
    pop 2
    ret

:drawLine()
    push 0     # pixelIdx
    push 0     # video mem addr

    :renderLine
        # calc memory addr
        add vm $1
        mov res $0
        mov 0 r3

        #skip paddle drawing if we're flashing
        div &8 2
        push res
        rnd res
        push res
        sub $1 $0
        abs res
        pop 2
        jgt :setPixelValue

        # skip player paddle drawing if we're too far right
        cmp $1 20
        jgt :drawAIPaddle

        # get player paddle result
        push 15
        push &2
        push $3
        push vl
        push 5
        push 50
        call :sampleRect()
        pop 6
        max r1 r3
        mov res r3

        :drawAIPaddle
        # skip AI paddle drawing if we're too far left
        cmp $1 268
        jlt :drawBall

        push 273
        push &3
        push $3
        push vl
        push 5
        push 50
        call :sampleRect()
        pop 6
        max r1 r3
        mov res r3

        :drawBall
        # skip drawing ball if not in range
        sub &4 4
        cmp $1 res
        jlt :setPixelValue
        add &4 4
        cmp $1 res
        jgt :setPixelValue

        push &4
        push &5
        push $3
        push vl
        push 4
        push 4
        call :sampleRect()
        pop 6
        max r1 r3
        mov res r3
        
        :setPixelValue
        mov r3 &$0
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

    sub $3 $5    # subtract x pos from screen x
    abs res      # abs result
    sub res $1   # subtract width from result
    mov res r1   # store in r1

    sub $2 $4    # subtract y pos from screen y
    abs res      # abs result
    sub res $0   # subtract height from result
    mov res r2   # store in r2

    max r1 r2    # take max
    mul res -1   # invert
    min res 1    # clamp
    max res 0    # clamp

    mov res r1
    ret

:getRandomSign()
    # calculates random based on random seed
    # @out r1 = random 1 or -1

    mul &2 &9
    div res 2
    mov res r1
    rnd res
    mov res r2
    sub r1 r2
    cmp res 0
    jne :getRandomSignEnd
    mov 1 res

    :getRandomSignEnd
    mov res r1
    add &9 1
    mov res &9
    ret
`;