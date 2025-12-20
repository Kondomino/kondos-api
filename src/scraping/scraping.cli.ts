import { CommandFactory } from 'nest-commander';
import { AppModule } from '../app.module';

async function bootstrap() {
  //console.log('🚀 Initializing scraping CLI...\n');
  
  await CommandFactory.run(AppModule, {
    logger: ['debug', 'error', 'warn', 'log', 'verbose'],
    errorHandler: (err) => {
      console.error('\n❌ Fatal error:', err.message);
      process.exit(1);
    }
  });
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
