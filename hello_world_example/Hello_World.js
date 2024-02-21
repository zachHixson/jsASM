const helloWorldCode = `
# Loops 10 times and logs number to console

# Only run once during v-blank
cmp vb 0                # compare v-blank register with 0
jeq :end                # jump to :end if not v-blanking

#declare variables
mov 0 &0                # i

:loop
    log &0              # log out current i value
    add 1 &0            # add 1 to i
    mov res &0          # move result into i
    cmp &0  10          # compare i to 10
    jlt :loop           # jump to :loop if comparison is less than 10

:end
end
`;