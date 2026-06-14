pub const FLAG_ALIVE: u32 = 1 << 0;

// Bits 1-2: assist kind (reserved for assist impl)
// Bits 3-9: assist_ticks_remaining (7 bits, reserved)

#[inline(always)]
pub fn is_alive(flags: u32) -> bool {
    flags & FLAG_ALIVE != 0
}

#[inline(always)]
pub fn set_dead(flags: u32) -> u32 {
    flags & !FLAG_ALIVE
}
