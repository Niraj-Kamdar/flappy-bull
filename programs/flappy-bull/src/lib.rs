use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder;
use sim_core::{
    init_state, is_alive, step, SeasonConfig as SimConfig, SimState as SimCoreState,
};

declare_id!("5JSBorB2EgNM2edr8iAvqh3tHkAVQk5HnAGRYMNjj4XQ");

// ── Newtype wrappers for sim-core types ─────────────────────────────────────
// sim-core is wasm-first (no anchor-lang). Wrappers let us serialize for PDAs
// without touching the orphan rule.

/// Fixed-point sim state — mirrors sim_core::SimState field-for-field.
#[derive(Clone, Copy, Debug, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
pub struct SimState {
    pub bull_y: i32,
    pub vel_y: i32,
    pub channel_center: i32,
    pub tick: u32,
    pub score: u32,
    pub price: i64,
    pub flags: u32,
    pub pipe_x: [i32; 4],
    pub pipe_gap: [i32; 4],
}

impl From<SimCoreState> for SimState {
    fn from(s: SimCoreState) -> Self {
        SimState {
            bull_y: s.bull_y,
            vel_y: s.vel_y,
            channel_center: s.channel_center,
            tick: s.tick,
            score: s.score,
            price: s.price,
            flags: s.flags,
            pipe_x: s.pipe_x,
            pipe_gap: s.pipe_gap,
        }
    }
}

impl From<SimState> for SimCoreState {
    fn from(s: SimState) -> Self {
        SimCoreState {
            bull_y: s.bull_y,
            vel_y: s.vel_y,
            channel_center: s.channel_center,
            tick: s.tick,
            score: s.score,
            price: s.price,
            flags: s.flags,
            pipe_x: s.pipe_x,
            pipe_gap: s.pipe_gap,
        }
    }
}

/// Physics config — mirrors sim_core::SeasonConfig field-for-field.
#[derive(Clone, Copy, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct SeasonConfig {
    pub gravity: i32,
    pub tap_boost: i32,
    pub max_up_vel: i32,
    pub max_vel_y: i32,
    pub scale: i32,
    pub canvas_h_px: i32,
    pub bull_radius_px: i32,
    pub channel_half_min: i32,
    pub lerp_num_base: i32,
    pub lerp_den: i32,
    pub lerp_num_fast: i32,
    pub canvas_w_px: i32,
    pub bull_x_px: i32,
    pub pipe_width_px: i32,
    pub pipe_scroll: i32,
    pub pipe_spacing_px: i32,
    pub price_vel_fast_thresh: i64,
    pub price_frac_scale: i64,
    pub season: u8,
    pub _pad: [u8; 3],
}

impl From<SimConfig> for SeasonConfig {
    fn from(c: SimConfig) -> Self {
        SeasonConfig {
            gravity: c.gravity,
            tap_boost: c.tap_boost,
            max_up_vel: c.max_up_vel,
            max_vel_y: c.max_vel_y,
            scale: c.scale,
            canvas_h_px: c.canvas_h_px,
            bull_radius_px: c.bull_radius_px,
            channel_half_min: c.channel_half_min,
            lerp_num_base: c.lerp_num_base,
            lerp_den: c.lerp_den,
            lerp_num_fast: c.lerp_num_fast,
            canvas_w_px: c.canvas_w_px,
            bull_x_px: c.bull_x_px,
            pipe_width_px: c.pipe_width_px,
            pipe_scroll: c.pipe_scroll,
            pipe_spacing_px: c.pipe_spacing_px,
            price_vel_fast_thresh: c.price_vel_fast_thresh,
            price_frac_scale: c.price_frac_scale,
            season: c.season,
            _pad: c._pad,
        }
    }
}

impl From<SeasonConfig> for SimConfig {
    fn from(c: SeasonConfig) -> Self {
        SimConfig {
            gravity: c.gravity,
            tap_boost: c.tap_boost,
            max_up_vel: c.max_up_vel,
            max_vel_y: c.max_vel_y,
            scale: c.scale,
            canvas_h_px: c.canvas_h_px,
            bull_radius_px: c.bull_radius_px,
            channel_half_min: c.channel_half_min,
            lerp_num_base: c.lerp_num_base,
            lerp_den: c.lerp_den,
            lerp_num_fast: c.lerp_num_fast,
            canvas_w_px: c.canvas_w_px,
            bull_x_px: c.bull_x_px,
            pipe_width_px: c.pipe_width_px,
            pipe_scroll: c.pipe_scroll,
            pipe_spacing_px: c.pipe_spacing_px,
            price_vel_fast_thresh: c.price_vel_fast_thresh,
            price_frac_scale: c.price_frac_scale,
            season: c.season,
            _pad: c._pad,
        }
    }
}

impl Default for SeasonConfig {
    fn default() -> Self {
        SimConfig::default().into()
    }
}

// ── Accounts ───────────────────────────────────────────────────────────────

#[account]
pub struct SeasonParams {
    pub authority: Pubkey,     // 32
    pub physics: SeasonConfig, // ~84
}

impl SeasonParams {
    // discriminator(8) + pubkey(32) + SeasonConfig(~84) + padding
    pub const SPACE: usize = 8 + 32 + 128 + 64;
}

#[account]
pub struct GameSession {
    pub player: Pubkey,
    pub session_key: Pubkey,
    pub season: u8,
    pub start_slot: u64,
    pub tap_count: u32,
    pub alive: bool,
    pub settled: bool,
    pub sim_state: SimState,
}

impl GameSession {
    // discriminator(8) + 32+32+1+8+4+1+1+SimState + padding
    pub const SPACE: usize = 8 + 32 + 32 + 1 + 8 + 4 + 1 + 1 + 128 + 64;
}

#[account]
pub struct Leaderboard {
    pub players: [Pubkey; 10],
    pub scores: [u32; 10],
    pub count: u8,
}

impl Leaderboard {
    pub const SPACE: usize = 8 + 320 + 40 + 1 + 64;
}

// ── Instructions ───────────────────────────────────────────────────────────

#[ephemeral]
#[program]
pub mod flappy_bull {
    use super::*;

    /// Admin: create the SeasonParams PDA with default physics.
    pub fn init_season(ctx: Context<InitSeason>) -> Result<()> {
        let s = &mut ctx.accounts.season_params;
        s.authority = ctx.accounts.authority.key();
        s.physics = SeasonConfig::default();
        msg!("Season {} initialized", s.physics.season);
        Ok(())
    }

    /// Admin: create the Leaderboard PDA (empty top-10).
    pub fn init_leaderboard(ctx: Context<InitLeaderboard>) -> Result<()> {
        let lb = &mut ctx.accounts.leaderboard;
        lb.players = [Pubkey::default(); 10];
        lb.scores = [0u32; 10];
        lb.count = 0;
        msg!("Leaderboard initialized");
        Ok(())
    }

    /// Player creates/resets a GameSession with a fresh sim state.
    pub fn start_run(ctx: Context<StartRun>, session_key: Pubkey) -> Result<()> {
        let gs = &mut ctx.accounts.game_session;
        let cfg: SimConfig = ctx.accounts.season_params.physics.into();
        let price = gs.sim_state.price;
        let mid_y = cfg.canvas_h_px * cfg.scale / 2;

        gs.player = ctx.accounts.player.key();
        gs.session_key = session_key;
        gs.season = cfg.season;
        gs.start_slot = Clock::get()?.slot;
        gs.tap_count = 0;
        gs.alive = true;
        gs.settled = false;
        gs.sim_state = init_state(mid_y, mid_y, price).into();

        msg!(
            "Run started: player={}, session_key={}",
            gs.player,
            gs.session_key
        );
        Ok(())
    }

    /// Delegate the GameSession PDA to the ER (existing pattern).
    pub fn delegate(ctx: Context<DelegateSession>) -> Result<()> {
        ctx.accounts.delegate_game_session(
            &ctx.accounts.payer,
            &[b"session", ctx.accounts.payer.key().as_ref()],
            DelegateConfig::default(),
        )?;
        msg!("GameSession delegated");
        Ok(())
    }

    /// ER instruction: advance sim_state by one tick with the submitted inputs.
    ///
    /// Client streams every frame: (tick, tap, price). On-chain advances the
    /// sim using the client-submitted price exactly, ensuring deterministic
    /// replay of the same channel_center trajectory as the client.
    pub fn submit_tap(
        ctx: Context<SubmitTap>,
        tick: u32,
        tap: bool,
        price_lo: u32,
        price_hi: i32,
    ) -> Result<()> {
        let gs = &mut ctx.accounts.game_session;

        // Auth: only the session key may submit taps
        require_keys_eq!(
            ctx.accounts.authority.key(),
            gs.session_key,
            ErrorCode::Unauthorized
        );

        // Monotonic tick. With per-frame streaming, tick == s.tick in the common
        // case (catch-up loop runs 0 iterations). The loop is a safety net for
        // rare dropped frames.
        require!(tick >= gs.sim_state.tick, ErrorCode::TickNotMonotonic);

        // Must be alive
        require!(gs.alive, ErrorCode::BullDead);

        // Use the client-submitted price directly for deterministic replay.
        let verified_price: i64 = ((price_hi as i64) << 32) | (price_lo as u64 as i64);
        let cfg: SimConfig = ctx.accounts.season_params.physics.into();

        // Catch-up loop: safety net for dropped frames (normally 0 iterations).
        let mut s: SimCoreState = gs.sim_state.into();
        for _ in s.tick..tick {
            if !is_alive(s.flags) {
                break;
            }
            s = step(s, &cfg, false, verified_price);
        }

        // Apply the actual tap flag for this frame
        if is_alive(s.flags) {
            s = step(s, &cfg, tap, verified_price);
        }

        gs.tap_count = gs.tap_count.saturating_add(1);

        if !is_alive(s.flags) {
            gs.alive = false;
        }

        gs.sim_state = s.into();
        Ok(())
    }

    /// ER instruction: catch up remaining ticks until death, then commit + undelegate.
    ///
    /// Works whether the bull is still alive (simulate forward to death) or
    /// already dead (the loop runs zero iterations). The dead case is needed to
    /// commit + undelegate a session that died mid-run, freeing the PDA.
    pub fn finish_run(ctx: Context<FinishRun>) -> Result<()> {
        let cfg: SimConfig = ctx.accounts.season_params.physics.into();
        let session_info = ctx.accounts.game_session.to_account_info();

        // Manually (de)serialize the GameSession. An `Account<GameSession>` is
        // unusable here: `commit_and_undelegate` reassigns the account's owner,
        // after which Anchor's automatic exit serialization would write to an
        // account we no longer own ("modified data of an account it does not
        // own"). We also must flush state to the buffer BEFORE the commit CPI,
        // since the commit reads the on-chain buffer (not Anchor's in-memory
        // copy, which is only written on exit — too late).
        let mut gs: GameSession =
            GameSession::try_deserialize(&mut &session_info.data.borrow()[..])?;

        // Verify the passed account is the session PDA for its recorded player.
        let (expected, _bump) =
            Pubkey::find_program_address(&[b"session", gs.player.as_ref()], &crate::ID);
        require_keys_eq!(session_info.key(), expected, ErrorCode::Unauthorized);

        let price = gs.sim_state.price;
        let mut s: SimCoreState = gs.sim_state.into();

        // Simulate forward until natural death (bounds or pipe collision).
        // Safety cap: 2_000_000 ticks ≈ 17 min at 120 fps.
        let start_tick = s.tick;
        let max_ticks = 2_000_000u32;
        while is_alive(s.flags) && s.tick - start_tick < max_ticks {
            s = step(s, &cfg, false, price);
        }

        gs.alive = false;
        gs.sim_state = s.into();

        // Flush updated state to the account buffer before committing.
        gs.try_serialize(&mut &mut session_info.data.borrow_mut()[..])?;

        // Commit updated state to base layer and undelegate.
        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit_and_undelegate(&[session_info.clone()])
        .build_and_invoke()?;

        msg!(
            "Run finished: score={}, tap_count={}, final_tick={}",
            gs.sim_state.score,
            gs.tap_count,
            gs.sim_state.tick
        );
        Ok(())
    }

    /// Base-layer instruction: verify finished run and insert into leaderboard.
    pub fn update_leaderboard(ctx: Context<UpdateLeaderboard>) -> Result<()> {
        let gs = &mut ctx.accounts.game_session;
        let lb = &mut ctx.accounts.leaderboard;

        require!(!gs.alive, ErrorCode::RunNotFinished);
        require!(!gs.settled, ErrorCode::AlreadySettled);
        require!(gs.tap_count > 0, ErrorCode::NoTapsSubmitted);
        require!(
            gs.sim_state.score <= gs.sim_state.tick,
            ErrorCode::ScoreExceedsTick
        );

        let score = gs.sim_state.score;
        let player = gs.player;

        // Insert into top-10 sorted descending by score.
        // Ties: first-to-achieve wins (existing entries stay, new ones go below).
        let mut pos = lb.count as usize;
        for i in (0..lb.count as usize).rev() {
            if score > lb.scores[i] {
                pos = i;
            } else {
                break;
            }
        }

        // Shift down to make room
        if pos < 10 {
            let end = (lb.count as usize).min(9);
            for i in (pos..end).rev() {
                lb.players[i + 1] = lb.players[i];
                lb.scores[i + 1] = lb.scores[i];
            }
            lb.players[pos] = player;
            lb.scores[pos] = score;
            if (lb.count as usize) < 10 {
                lb.count = lb.count.saturating_add(1);
            }
        }

        gs.settled = true;

        msg!(
            "Leaderboard updated: player={}, score={}, rank={}",
            player,
            score,
            pos.saturating_add(1)
        );
        Ok(())
    }
}

// ── Account Validation Structs ─────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitSeason<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = SeasonParams::SPACE,
        seeds = [b"season"],
        bump
    )]
    pub season_params: Account<'info, SeasonParams>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitLeaderboard<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Leaderboard::SPACE,
        seeds = [b"lb"],
        bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartRun<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init_if_needed,
        payer = player,
        space = GameSession::SPACE,
        seeds = [b"session", player.key().as_ref()],
        bump
    )]
    pub game_session: Account<'info, GameSession>,
    #[account(
        seeds = [b"season"],
        bump,
    )]
    pub season_params: Account<'info, SeasonParams>,
    pub system_program: Program<'info, System>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateSession<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: PDA to delegate
    #[account(
        mut,
        del,
        seeds = [b"session", payer.key().as_ref()],
        bump
    )]
    pub game_session: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct SubmitTap<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // ephemeral session_key
    #[account(
        mut,
        seeds = [b"session", game_session.player.key().as_ref()],
        bump,
    )]
    pub game_session: Account<'info, GameSession>,
    #[account(
        seeds = [b"season"],
        bump,
    )]
    pub season_params: Account<'info, SeasonParams>,
}

#[commit]
#[derive(Accounts)]
pub struct FinishRun<'info> {
    #[account(mut)]
    pub payer: Signer<'info>, // ephemeral session_key
    /// CHECK: GameSession PDA, manually (de)serialized in the handler to avoid
    /// Anchor re-serializing after commit_and_undelegate reassigns ownership.
    /// The PDA is verified against its recorded player in the handler.
    #[account(mut)]
    pub game_session: UncheckedAccount<'info>,
    #[account(
        seeds = [b"season"],
        bump,
    )]
    pub season_params: Account<'info, SeasonParams>,
}

#[derive(Accounts)]
pub struct UpdateLeaderboard<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [b"session", player.key().as_ref()],
        bump,
    )]
    pub game_session: Account<'info, GameSession>,
    #[account(
        mut,
        seeds = [b"lb"],
        bump,
    )]
    pub leaderboard: Account<'info, Leaderboard>,
}

// ── Errors ─────────────────────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Only the session key may submit taps")]
    Unauthorized,
    #[msg("Tick must be greater than the current sim tick")]
    TickNotMonotonic,
    #[msg("Bull is already dead")]
    BullDead,
    #[msg("Run must be finished (bull dead) before updating leaderboard")]
    RunNotFinished,
    #[msg("This run has already been settled")]
    AlreadySettled,
    #[msg("Must submit at least one tap")]
    NoTapsSubmitted,
    #[msg("Score cannot exceed tick count")]
    ScoreExceedsTick,
}
