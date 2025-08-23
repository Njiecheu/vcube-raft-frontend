// Comptes de test basés sur les données du backend
export const TEST_ACCOUNTS = {
  users: [
    {
      email: "raph@vcube.com",
      password: "airline",
      role: "USER",
      userId: "b667695d-883b-4513-8633-4d4961ac2cd3",
      name: "Ange"
    },
    {
      email: "raphaelnjiecheu@gmail.com", 
      password: "simple_airline",
      role: "USER",
      userId: "ed72c902-d534-4ec8-a69b-ab27399db8d0",
      name: "ange"
    }
  ],
  providers: [
    {
      email: "prov2@vcube.com",
      password: "airline", 
      role: "PROVIDER",
      userId: "96d5caa4-6ba4-46e7-a2fc-7cbbfd04c620",
      name: "Directeur"
    },
    {
      email: "prov1@vcube.com",
      password: "transport",
      role: "PROVIDER", 
      userId: "45ba8f36-f91f-4569-bcaa-d69b1191bb57",
      name: "Général"
    }
  ],
  admins: [
    // Note: Il faudra créer des comptes admin dans le backend
    {
      email: "admin@vcube.com",
      password: "admin123",
      role: "ADMIN",
      userId: "admin-id",
      name: "Administrateur"
    }
  ]
};

export const getTestAccountByEmail = (email: string) => {
  const allAccounts = [
    ...TEST_ACCOUNTS.users,
    ...TEST_ACCOUNTS.providers, 
    ...TEST_ACCOUNTS.admins
  ];
  return allAccounts.find(account => account.email === email);
};
