import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { Input } from '../../src/components/shared/Input';
import { renderWithProviders } from '../utils';

describe('Input Component', () => {
  it('should render input with placeholder', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <Input placeholder="Enter text" />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('should call onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <Input placeholder="Enter text" onChangeText={onChangeText} />
    );

    const input = getByPlaceholderText('Enter text');
    fireEvent.changeText(input, 'test input');

    expect(onChangeText).toHaveBeenCalledWith('test input');
  });

  it('should display value', () => {
    const { getByDisplayValue } = renderWithProviders(
      <Input placeholder="Enter text" value="current value" />
    );
    expect(getByDisplayValue('current value')).toBeTruthy();
  });

  it('should show error message', () => {
    const { getByText } = renderWithProviders(
      <Input placeholder="Enter text" errorMessage="This field is required" />
    );
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('should be disabled when disabled prop is true', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <Input placeholder="Enter text" disabled onChangeText={onChangeText} />
    );

    const input = getByPlaceholderText('Enter text');
    expect(input.props.editable).toBe(false);
  });

  it('should render with left icon', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <Input 
        placeholder="Enter text"
        leftIcon={{ name: 'user', type: 'feather' }}
      />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('should render with right icon', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <Input 
        placeholder="Enter text"
        rightIcon={{ name: 'check', type: 'feather' }}
      />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });
});
