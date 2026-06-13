use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder;

declare_id!("96hj71eqGzxuLhLSnVL9BB4WoA3xn9riKq3BLAxmxR7J");

#[ephemeral]
#[program]
pub mod flappy_bull {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let session = &mut ctx.accounts.game_session;
        session.player = ctx.accounts.player.key();
        session.score = 0;
        session.started_at = Clock::get()?.unix_timestamp;
        session.alive = true;
        session.session_key = ctx.accounts.player.key();
        session.settled = false;
        Ok(())
    }

    pub fn delegate(ctx: Context<DelegateSession>) -> Result<()> {
        ctx.accounts.delegate_game_session(
            &ctx.accounts.payer,
            &[b"session", ctx.accounts.payer.key().as_ref()],
            DelegateConfig::default(),
        )?;
        Ok(())
    }

    pub fn undelegate(ctx: Context<UndelegateSession>) -> Result<()> {
        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit_and_undelegate(&[ctx.accounts.game_session.to_account_info()])
        .build_and_invoke()?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        init,
        payer = player,
        space = 8 + 32 + 8 + 8 + 1 + 32 + 1,
        seeds = [b"session", player.key().as_ref()],
        bump
    )]
    pub game_session: Account<'info, GameSession>,
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
    pub game_session: AccountInfo<'info>,
}

#[commit]
#[derive(Accounts)]
pub struct UndelegateSession<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub game_session: Account<'info, GameSession>,
}

#[account]
pub struct GameSession {
    pub player: Pubkey,
    pub score: u64,
    pub started_at: i64,
    pub alive: bool,
    pub session_key: Pubkey,
    pub settled: bool,
}
