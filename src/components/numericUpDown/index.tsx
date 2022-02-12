import React, { useState } from 'react';
import { View, ViewProps } from 'react-native';
import { CustomButton } from '../button';
import { CustomNumberInput } from '../numberInput';
import styles from './styles';

export function NumericUpDown(props: ViewProps) {
  let {
    style,
    ...rest
  } = props;

  let [amount, setAmount] = useState<number>(0);

  function handleDown() {
    setAmount(oldValue => {
      if (oldValue <= 0) {
        return 0;
      }

      return --oldValue
    });
  }

  function handleUp() {
    setAmount(oldValue => ++oldValue);
  }

  return (
    <View {...rest} style={[styles.container, style]}>
      <CustomButton style={styles.upDownButton} title='-' onPress={handleDown}></CustomButton>
      <CustomNumberInput style={styles.input} defaultValue={String(amount)} />
      <CustomButton style={styles.upDownButton} title='+' onPress={handleUp}></CustomButton>
    </View>
  )
}