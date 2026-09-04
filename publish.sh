OUTDIR=dist
pnpm run build
DOMAIN=engineering-game.surge.sh
surge $OUTDIR --domain $DOMAIN
open https://$DOMAIN