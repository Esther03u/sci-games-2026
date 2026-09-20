import { redirect } from 'next/navigation';

export const metadata = {
  title: 'ตารางการแข่งขัน',
};

export default function RegisterPage() {
  redirect('/schedule');
}
