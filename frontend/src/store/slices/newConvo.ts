import { createSlice } from "@reduxjs/toolkit";

type InitialState = {
    isNewConvo : boolean
}

const initialState : InitialState = { 
    isNewConvo : false
}

const newConvoSlice = createSlice({
  name: "newConvo",
  initialState,
  reducers: {
    setNewConvo: (state)=>{
        state.isNewConvo = true
    },
    offNewConvo : (state)=>{
        state.isNewConvo = false
    },
  },
});

export const { setNewConvo , offNewConvo } = newConvoSlice.actions;
export default newConvoSlice.reducer;