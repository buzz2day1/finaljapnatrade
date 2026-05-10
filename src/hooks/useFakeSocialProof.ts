import { useState, useEffect, useCallback } from 'react';

export interface SocialProofMessage {
  id: string;
  type: 'bet' | 'win' | 'loss';
  userName: string;
  amount: number;
  action: string;
  coin?: string;
  timestamp: number;
}

// 100+ common Indian names (male and female)
const INDIAN_NAMES = [
  // Male Names
  'Arjun', 'Rahul', 'Vikram', 'Amit', 'Rohit', 'Suresh', 'Rajesh', 'Deepak', 
  'Mohan', 'Vijay', 'Sanjay', 'Ajay', 'Rakesh', 'Ankit', 'Karan', 'Vivek',
  'Aditya', 'Nikhil', 'Gaurav', 'Manish', 'Akash', 'Vishal', 'Sachin', 'Pankaj',
  'Ravi', 'Ashish', 'Shubham', 'Varun', 'Harsh', 'Tushar', 'Pranav', 'Yash',
  'Rohan', 'Kunal', 'Sahil', 'Aman', 'Faisal', 'Imran', 'Farhan', 'Rizwan',
  'Aakash', 'Dhruv', 'Aryan', 'Ishaan', 'Kabir', 'Veer', 'Dev', 'Raj',
  'Mohit', 'Naveen', 'Sunil', 'Anil', 'Mukesh', 'Ramesh', 'Dinesh', 'Lokesh',
  'Prakash', 'Sandeep', 'Harish', 'Girish', 'Manoj', 'Vinod', 'Santosh', 'Yogesh',
  
  // Female Names
  'Priya', 'Sneha', 'Anjali', 'Pooja', 'Meera', 'Kavita', 'Sunita', 'Rekha',
  'Neha', 'Komal', 'Geeta', 'Preeti', 'Swati', 'Nisha', 'Shalini', 'Ananya',
  'Zoya', 'Riya', 'Aisha', 'Simran', 'Tanvi', 'Shruti', 'Divya', 'Megha',
  'Rashmi', 'Shikha', 'Pallavi', 'Bhavna', 'Jyoti', 'Mamta', 'Seema', 'Rani',
  'Kiran', 'Suman', 'Radha', 'Lata', 'Usha', 'Kamla', 'Sarita', 'Vandana',
  'Archana', 'Sapna', 'Manisha', 'Alka', 'Deepa', 'Shweta', 'Nikita', 'Sakshi',
  'Aditi', 'Ishita', 'Kriti', 'Tanya', 'Diya', 'Aarohi', 'Kiara', 'Anvi',
  'Fatima', 'Ayesha', 'Sana', 'Hina', 'Noor', 'Sara', 'Zara', 'Aliya'
];

// Low-fee coins only
const COINS = ['LTC/USDT', 'TRX/USDT', 'DOGE/USDT'];

// Realistic bet amounts (in rupees)
const BET_AMOUNTS = [200, 300, 500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

// Win amounts (calculated as bet * 2 rounded - 2x payout)
const WIN_MULTIPLIER = 2.0;

export const useFakeSocialProof = () => {
  const [messages, setMessages] = useState<SocialProofMessage[]>([]);

  const generateFakeMessage = useCallback((): SocialProofMessage => {
    const randomName = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
    const random = Math.random();

    if (random < 0.35) {
      // Bet placement (35%)
      const amount = BET_AMOUNTS[Math.floor(Math.random() * BET_AMOUNTS.length)];
      const direction = Math.random() < 0.5 ? 'UP' : 'DOWN';
      return {
        id: Date.now().toString() + Math.random(),
        type: 'bet',
        userName: randomName,
        amount,
        action: `placed ₹${amount.toLocaleString()} on ${direction}`,
        timestamp: Date.now(),
      };
    } else if (random < 0.85) {
      // Win (50% of remaining = 70% of outcomes shown)
      const betAmount = BET_AMOUNTS[Math.floor(Math.random() * BET_AMOUNTS.length)];
      const winAmount = Math.round(betAmount * WIN_MULTIPLIER);
      const coin = COINS[Math.floor(Math.random() * COINS.length)];
      return {
        id: Date.now().toString() + Math.random(),
        type: 'win',
        userName: randomName,
        amount: winAmount,
        action: `won ₹${winAmount.toLocaleString()} on ${coin}`,
        coin,
        timestamp: Date.now(),
      };
    } else {
      // Loss (15% = 30% of outcomes shown)
      const amount = BET_AMOUNTS[Math.floor(Math.random() * BET_AMOUNTS.length)];
      const coin = COINS[Math.floor(Math.random() * COINS.length)];
      return {
        id: Date.now().toString() + Math.random(),
        type: 'loss',
        userName: randomName,
        amount,
        action: `lost ₹${amount.toLocaleString()} on ${coin}`,
        coin,
        timestamp: Date.now(),
      };
    }
  }, []);

  useEffect(() => {
    const addMessage = () => {
      const newMessage = generateFakeMessage();
      setMessages(prev => {
        const updated = [newMessage, ...prev].slice(0, 25); // Keep last 25 messages
        return updated;
      });
    };

    // Initial messages with stagger
    for (let i = 0; i < 6; i++) {
      setTimeout(() => addMessage(), i * 400);
    }

    // Continuous messages every 4-10 seconds
    let timeoutId: NodeJS.Timeout;
    const scheduleNext = () => {
      const delay = 4000 + Math.random() * 6000; // 4-10 seconds
      timeoutId = setTimeout(() => {
        addMessage();
        scheduleNext();
      }, delay);
    };
    
    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [generateFakeMessage]);

  return messages;
};
