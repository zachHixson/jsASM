const helloWorldCode = `
# Loops 10 times and logs number to console

# Only run once during v-blank
cmp vb 0
jeq :end

#declare variables
mov 0 &0    # i

:loop
    log &0
    add 1 &0
    mov res &0
    cmp res 10
    jlt :loop

:end
end
`;