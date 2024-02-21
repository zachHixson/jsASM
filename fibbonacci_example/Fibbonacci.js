const fibbonacciCode = `
# Logs the first 25 numbers in the fibbonacci sequence

# Only run once during v-blank
cmp vb 1
jeq :start
end

:start

#declare variables
mov 0 &0                # i

:loop
    # calculate fibbonacci
    push &0             # set the input value to the :fibbonacci function to i
    call :fibbonacci
    pop 1
    log res

    #increment loop
    add 1 &0
    mov res &0
    cmp res 15
    jlt :loop
end

:fibbonacci
    # expects last pushed value (currently $0) to be the input number
    # stores result in 'res'

    # return value if less than 1
    cmp $0 1
    jgt :calcFib
    mov $0 res
    jmp :fibEnd

    :calcFib

    push ret            # cache return line value so it doesn't get messed up in recursive calls

    # calculate branch 1
    sub $1 1            # subtract 1 from the passed in value
    push res            # push the result of our subtraction so :fibbonacci can use it
    call :fibbonacci    # call :fibbonacci
    pop 1
    mov res r1          # store calculated result in r1

    # calculate branch 2
    sub $1 2
    push r1             # Cache r1 value (yes this could be more optimized, but it becomes a lot less readable)
    push res
    call :fibbonacci
    mov $1 r1           # restore cached r1 value
    pop 2
    mov res r2          # store calculated result in r2

    mov $0 ret          # restore the cached return line value
    pop 1

    add r1 r2           # add results of both branches together

    :fibEnd
    ret
`;