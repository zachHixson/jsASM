cmp &0 1
jeq :start

# declare global variables
mov 287 &1    # screen width
mov 112 &2    # player Y
mov 112 &3    # AI Y
mov 144 &4    # ball x
mov 112 &5    # ball y
mov -3  &6    # ball vel x
mov 5   &7    # ball vel y

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
    mov $7 ret
    pop 7

    :checkAI
    # check AI collision

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