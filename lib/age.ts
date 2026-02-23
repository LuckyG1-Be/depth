export function calculateAge(birthdate?: Date | string | null) {
    if (!birthdate) return null;
  
    const b = new Date(birthdate);
    const today = new Date();
  
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
  
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) {
      age--;
    }
  
    return age;
  }
  