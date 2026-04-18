
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PatientsService } from './src/patients/patients.service';
import { UsersService } from './src/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const patientsService = app.get(PatientsService);
  const usersService = app.get(UsersService);
  
  console.log('--- USERS ---');
  const users = await (usersService as any).usersRepository.find({ relations: ['profile'] });
  users.forEach(u => {
    console.log(`User ID: ${u.id}, Email: ${u.email}, Roles: ${u.roles}, Name: ${u.profile?.firstName} ${u.profile?.lastName}`);
  });
  
  console.log('\n--- PATIENT RECORDS (clinical) ---');
  const patients = await (patientsService as any).patientsRepository.find();
  patients.forEach(p => {
    console.log(`Patient ID: ${p.id}, DisplayID: ${p.patientId}, UserId: ${p.userId}, Name: ${p.firstName} ${p.lastName}`);
  });

  await app.close();
}

bootstrap();
